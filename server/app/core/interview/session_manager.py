"""Session manager — state, phase history, transcript rows (docs §11)."""
import datetime
from sqlalchemy.orm import Session
from app.models.models import InterviewSession, InterviewMessage

def create(db: Session, user_id: str, resume_id: str | None, candidate: str, role: str) -> InterviewSession:
    import uuid
    s = InterviewSession(user_id=user_id, resume_id=resume_id, room_name=f"room_{uuid.uuid4().hex[:8]}",
                         candidate_name=candidate, target_role=role, status="live",
                         current_phase="introduction", exchange_count=0)
    db.add(s); db.commit(); db.refresh(s)
    return s

def get(db: Session, room: str) -> InterviewSession | None:
    return db.query(InterviewSession).filter_by(room_name=room).first()

def add_message(db: Session, s: InterviewSession, role: str, content: str, phase: str,
                dur: float = 0.0, conf: float = 1.0) -> None:
    db.add(InterviewMessage(session_id=s.id, role=role, content=content, phase=phase,
                            audio_duration_seconds=dur, transcription_confidence=conf))
    db.commit()

def transcript(db: Session, s: InterviewSession) -> list[dict]:
    rows = db.query(InterviewMessage).filter_by(session_id=s.id).order_by(InterviewMessage.timestamp).all()
    return [{"role": m.role, "content": m.content, "phase": m.phase} for m in rows]

def bump(db: Session, s: InterviewSession, phase: str, ended: bool, counts: dict) -> None:
    s.current_phase = phase
    s.exchange_count = sum(counts.values())
    if ended:
        s.status = "ending"
    db.commit()

def mark_report(db: Session, s: InterviewSession, evaluation: dict, pdf_path: str) -> None:
    from app.models.models import InterviewReport
    s.status = "report_ready"; s.end_time = datetime.datetime.utcnow()
    s.evaluation_json = evaluation; s.report_pdf_path = pdf_path
    rep = db.query(InterviewReport).filter_by(session_id=s.id).first()
    radar = {k: evaluation.get(k, 0) for k in
             ["communication", "technical_correctness", "project_ownership", "problem_solving",
              "resume_consistency", "role_readiness", "confidence", "depth_of_explanation", "behavioral_maturity"]}
    if not rep:
        db.add(InterviewReport(session_id=s.id, evaluation_json=evaluation, radar_json=radar, report_pdf_path=pdf_path))
    else:
        rep.evaluation_json = evaluation; rep.radar_json = radar; rep.report_pdf_path = pdf_path
    db.commit()
