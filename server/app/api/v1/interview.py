"""Interview API — docs §12 endpoints over agent/flow/session/report modules."""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import ExtractedProfile, Resume
from app.core.interview import session_manager as SM
from app.core.interview import flow_manager as FM
from app.core.interview import resume_service as RS
from app.core.interview import agent as AG
from app.core.interview import report_generator as RG
from app.core.ai.vector import index_text, retrieve
router = APIRouter(prefix="/interview", tags=["interview"])

def _brief(db: Session, resume_id: str | None) -> dict:
    if not resume_id:
        return RS.summarize({})
    ex = db.query(ExtractedProfile).filter_by(resume_id=resume_id).first()
    return RS.summarize(ex.profile_json if ex else {})

@router.post("/start")
async def start(d: dict, db: Session = Depends(get_db)):
    s = SM.create(db, user_id="demo", resume_id=d.get("resume_id"),
                  candidate=d.get("candidate_name", "Candidate"),
                  role=d.get("target_role", "Full Stack Developer"))
    brief = _brief(db, d.get("resume_id"))
    try:
        r = db.query(Resume).filter_by(id=d.get("resume_id")).first() if d.get("resume_id") else None
        if r and r.raw_text:
            index_text(s.room_name, r.raw_text)
    except Exception:
        pass
    opening = await AG.opening(brief)
    SM.add_message(db, s, "assistant", opening, "introduction")
    return {"room_name": s.room_name, "session_id": s.id, "opening": opening,
            "phase": "introduction", "phases": FM.PHASES}

@router.get("/token")
def tok(room_name: str, participant_name: str = "student"):
    if os.getenv("LIVEKIT_API_KEY"):
        return {"token": "livekit-token", "url": os.getenv("LIVEKIT_URL", ""), "demo": False}
    return {"token": f"demo-token-{room_name}-{participant_name}",
            "url": "wss://demo.livekit.cloud", "demo": True}

@router.post("/message")
async def message(d: dict, db: Session = Depends(get_db)):
    """One user utterance (text or STT transcript) → store → advance phase → next AI question."""
    s = SM.get(db, d.get("room_name", ""))
    if not s:
        raise HTTPException(404, "session not found")
    if s.status == "report_ready":
        return {"ended": True, "phase": s.current_phase}
    phase = s.current_phase
    SM.add_message(db, s, "user", d.get("content", "")[:2000], phase,
                   d.get("audio_duration_seconds", 0), d.get("transcription_confidence", 1.0))
    counts = {m["phase"]: sum(1 for x in SM.transcript(db, s) if x["role"] == "user" and x["phase"] == m["phase"])
              for m in [{"phase": p} for p in FM.PHASES]}
    new_phase, ended = FM.register_exchange(phase, counts)
    SM.bump(db, s, new_phase, ended, counts)
    if ended:
        return {"ended": True, "phase": new_phase, "hint": "Wrapping up — call end-interview for the report."}
    brief = _brief(db, s.resume_id)
    rag = retrieve(s.room_name, d.get("content", "")) if s.resume_id else []
    reply = await AG.next_question(brief, new_phase, SM.transcript(db, s), rag)
    SM.add_message(db, s, "assistant", reply, new_phase)
    return {"reply": reply, "phase": new_phase, "phase_label": FM.LABELS[new_phase],
            "exchange": counts.get(new_phase, 0), "ended": False}

@router.post("/end-interview")
def end(d: dict, db: Session = Depends(get_db)):
    s = SM.get(db, d.get("room_name", ""))
    if not s:
        raise HTTPException(404, "session not found")
    msgs = SM.transcript(db, s)
    evaluation = RG.score_transcript(msgs, _brief(db, s.resume_id))
    path = RG.build_pdf(s.room_name, s.candidate_name, s.target_role, evaluation)
    SM.mark_report(db, s, evaluation, path)
    return {"evaluation": evaluation, "report_ready": True}

@router.get("/session-status/{room}")
def status(room: str, db: Session = Depends(get_db)):
    s = SM.get(db, room)
    if not s:
        return {"status": "live", "phase": "introduction", "phase_label": FM.LABELS["introduction"]}
    return {"status": s.status, "phase": s.current_phase, "phase_label": FM.LABELS.get(s.current_phase, ""),
            "exchange_count": s.exchange_count, "report_ready": s.status == "report_ready"}

@router.get("/session/{room}")
def sess(room: str, db: Session = Depends(get_db)):
    s = SM.get(db, room)
    if not s:
        return {"room_name": room, "demo": True, "evaluation": RG.legacy_stub()}
    return {"room_name": room, "status": s.status, "phase": s.current_phase,
            "evaluation": s.evaluation_json, "messages": SM.transcript(db, s)}

@router.get("/download-report/{room}")
def dl(room: str):
    p = f"data/outputs/{room}.pdf"
    return FileResponse(p) if os.path.exists(p) else {"detail": "generating"}

@router.get("/history")
def hist(db: Session = Depends(get_db)):
    from app.models.models import InterviewSession
    rows = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).limit(20).all()
    return {"sessions": [{"room_name": r.room_name, "status": r.status,
                          "score": (r.evaluation_json or {}).get("overall_recommendation")} for r in rows]}

@router.get("/health")
def health():
    return {"livekit": bool(os.getenv("LIVEKIT_API_KEY")), "phases": FM.LIMITS, "mode": "cloud" if os.getenv("LIVEKIT_API_KEY") else "demo-text"}
