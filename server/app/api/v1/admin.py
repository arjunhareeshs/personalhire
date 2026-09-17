from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User, Resume, AnalysisResult, InterviewSession, BackgroundJob, AdminAction
from app.utils.auth import require_role
import re
router = APIRouter(prefix="/admin", tags=["admin"],
                   dependencies=[Depends(require_role("admin", "recruiter", "super_admin"))])
@router.get("/dashboard")
def dash(db: Session = Depends(get_db)):
    atss = [r.ats_score for r in db.query(AnalysisResult).all() if r.ats_score]
    return {"total_candidates": db.query(User).filter_by(role="student").count(), "total_resumes": db.query(Resume).count(),
            "avg_ats": round(sum(atss) / len(atss)) if atss else 0, "failed_jobs": db.query(BackgroundJob).filter_by(status="failed").count()}
@router.get("/candidates")
def cands(role: str | None = None, ats_min: int = 0, db: Session = Depends(get_db)):
    users = db.query(User).filter_by(role="student").all()
    out = []
    for u in users:
        r = db.query(Resume).filter_by(user_id=u.id).order_by(Resume.created_at.desc()).first()
        a = db.query(AnalysisResult).filter_by(resume_id=r.id).first() if r else None
        if a and a.ats_score < ats_min: continue
        out.append({"candidate_id": u.id, "name": u.name, "email": u.email, "target_role": "—", "ats_score": a.ats_score if a else 0, "status": r.status if r else "none"})
    return {"candidates": out}
@router.get("/candidates/{cid}")
def one(cid: str, db: Session = Depends(get_db)):
    from app.models.models import ExtractedProfile, ResumeLink
    u = db.query(User).filter_by(id=cid).first()
    if not u:
        return {"candidate_id": cid, "name": cid}
    r = db.query(Resume).filter_by(user_id=u.id).order_by(Resume.created_at.desc()).first()
    ex = db.query(ExtractedProfile).filter_by(resume_id=r.id).first() if r else None
    a = db.query(AnalysisResult).filter_by(resume_id=r.id).first() if r else None
    links = db.query(ResumeLink).filter_by(resume_id=r.id).all() if r else []
    ivs = db.query(InterviewSession).filter_by(user_id=u.id).order_by(InterviewSession.created_at.desc()).all()
    notes = db.query(AdminAction).filter_by(candidate_id=u.id).order_by(AdminAction.created_at.desc()).all()
    return {"candidate_id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "resume_id": r.id if r else None, "resume_status": r.status if r else "none",
            "profile": ex.profile_json if ex else None,
            "confidence": ex.confidence_json if ex else {},
            "scores": {"overall": a.overall_score if a else 0, "ats": a.ats_score if a else 0,
                       "role_fit": a.role_fit_score if a else 0, "links": a.link_score if a else 0},
            "links": [{"url": l.url, "platform": l.platform, "status": l.verification_status} for l in links],
            "interviews": [{"room": i.room_name, "status": i.status, "phase": i.current_phase,
                            "score": (i.evaluation_json or {}).get("overall_recommendation")} for i in ivs],
            "notes": [{"action": n.action, "note": n.note, "at": str(n.created_at)} for n in notes]}

@router.get("/candidates/{cid}/resume-search")
def resume_search(cid: str, q: str = "", db: Session = Depends(get_db)):
    """In-resume search served FROM the stored index (no ad-hoc text scan).
    The admin resume view refreshes from these indexed sections."""
    from app.models.models import ExtractedProfile
    from app.core.search import rank as R
    u = db.query(User).filter_by(id=cid).first()
    r = db.query(Resume).filter_by(user_id=(u.id if u else cid)).order_by(Resume.created_at.desc()).first()
    if not r:
        return {"query": q, "indexed": False, "matches": [], "total": 0}
    if not q.strip():
        return {"query": q, "indexed": True, "matches": [], "total": 0,
                "sections": [], "section_count": 0, "terms": []}
    hits = R.search(db, q, resume_ids=[r.id], top_k=1)
    if not hits:
        return {"query": q, "indexed": True, "matches": [], "total": 0, "sections": [], "section_count": 0, "terms": []}
    ex = db.query(ExtractedProfile).filter_by(resume_id=r.id).first()
    prof = ex.profile_json if ex else {}
    from app.models.models import SearchTerm
    from app.core.search.store import extract_fields
    terms = hits[0]["matched_terms"]
    field_text = extract_fields(prof, r.raw_text or "")
    posts = db.query(SearchTerm).filter_by(resume_id=r.id).filter(SearchTerm.term.in_(terms)).all() if terms else []
    grouped: dict[str, dict] = {}
    for p in posts:
        f = max((p.fields_json or {"raw": 1}), key=lambda k: (p.fields_json or {"raw": 1})[k])
        g = grouped.setdefault(f, {"hits": 0.0, "terms": set()})
        g["hits"] += p.tf_w
        g["terms"].add(p.term)
    sections = []
    for fname, g in sorted(grouped.items(), key=lambda x: -x[1]["hits"]):
        t = field_text.get(fname, "")
        low = t.lower()
        idx = min([low.find(term) for term in g["terms"] if term in low] or [0])
        start = max(0, idx - 90)
        sections.append({"section": fname, "hits": round(g["hits"], 1),
                         "matched_terms": sorted(g["terms"]),
                         "snippet": ("…" if start else "") + t[start:start + 280], "ref": {}})
    return {"query": q, "indexed": True, "terms": terms, "total": hits[0]["score"],
            "matches": hits, "sections": sections, "section_count": len(sections)}
@router.post("/bulk-upload")
async def bulk(files: list[UploadFile], db: Session = Depends(get_db)):
    """Many-resume ingestion: upload → extract → analyze → INDEX, per file, batched."""
    from app.api.v1.resumes import upload as up
    from app.api.v1.extraction import run_extraction
    from app.core.analysis.engine import analyze
    from app.models.models import ExtractedProfile, AnalysisResult
    done, failed, dupes = 0, [], 0
    for f in files:
        try:
            r = await up(f, db)
            if r.get("duplicate"):
                dupes += 1
                continue
            rid = r["resume_id"]
            out = await run_extraction(db, rid)  # also builds stored index
            a = analyze(out["profile"])
            db.add(AnalysisResult(resume_id=rid, overall_score=a["overall_score"], ats_score=a["ats_score"],
                                  role_fit_score=a["role_fit_score"], link_score=a["link_verification_score"], analysis_json=a))
            db.commit()
            done += 1
        except Exception as e:
            db.rollback()
            failed.append({"file": f.filename, "error": str(e)[:200]})
    return {"total": len(files), "processed": done, "duplicates_skipped": dupes, "failed": failed}
@router.post("/search")
def search(d: dict, db: Session = Depends(get_db)):
    """Hybrid NL + full-text: natural language → structured filters, BM25 over the
    STORED resume index for ranking. Nothing scans raw text at query time."""
    from app.models.models import ExtractedProfile
    from app.core.search import rank as R, nlp as NLP
    q = d.get("query", "")
    low = q.lower()
    m = re.search(r"(ats|resume|interview|role[\s-]?fit).*?(above|over|>|min)\s*(\d+)", low)
    score_min = int(m.group(3)) if m else 0
    score_kind = (m.group(1) if m else "ats").replace(" ", "_")
    known = ["react", "python", "fastapi", "node", "typescript", "javascript", "sql", "postgresql",
             "mongodb", "docker", "kubernetes", "aws", "tensorflow", "pytorch", "java", "figma"]
    skills = [s for s in known if s in low]
    # BM25 over stored index (text part of the query, minus filter words)
    text_q = re.sub(r"(above|over|>|min|ats|resume|interview|role|fit|score|candidates?|show|find|with|and)\s*\d*", " ", low)
    ranked = {h["resume_id"]: h for h in R.search(db, text_q, top_k=100)} if text_q.strip() else {}
    users = db.query(User).filter_by(role="student").all()
    res = []
    for u in users:
        r = db.query(Resume).filter_by(user_id=u.id).order_by(Resume.created_at.desc()).first()
        if not r:
            continue
        a = db.query(AnalysisResult).filter_by(resume_id=r.id).first()
        ats = a.ats_score if a else 0
        if ats < score_min:
            continue
        bm = ranked.get(r.id)
        if text_q.strip() and not bm and (skills or NLP.parse_query(text_q)["terms"]):
            continue  # full-text gate: must match the stored index
        ex = db.query(ExtractedProfile).filter_by(resume_id=r.id).first()
        prof = (ex.profile_json or {}) if ex else {}
        pi = prof.get("personal_information", {}) or {}
        why = [f"ATS {ats}" + (f" >= {score_min}" if score_min else "")]
        if bm:
            why.append(f"index score {bm['score']} [{', '.join(bm['matched_terms'][:5])}]")
        if skills:
            why.append("skills: " + ", ".join(skills))
        res.append({"candidate_id": u.id, "name": u.name, "email": u.email,
                    "target_role": pi.get("target_role", "—"), "ats_score": ats,
                    "status": r.status, "bm25": bm["score"] if bm else 0,
                    "matched_terms": bm["matched_terms"] if bm else [],
                    "why": "; ".join(why)})
    res.sort(key=lambda x: (-x["bm25"], -x["ats_score"]))
    return {"filters": {"score_kind": score_kind, "score_min": score_min, "skills": skills},
            "explanation": f"Parsed: {score_kind} >= {score_min}" + (f", skills {skills}" if skills else "") +
                           f"; BM25 over stored index ({len(ranked)} index hits); ranked by index score then ATS.",
            "index": {"documents": len(ranked)},
            "count": len(res), "candidates": res[:20]}

@router.get("/search-index/stats")
def index_stats(db: Session = Depends(get_db)):
    from app.core.search import store as S
    return {"engine": "stored inverted index + BM25", **S.collection_stats(db)}

@router.post("/search-index/rebuild")
def index_rebuild(db: Session = Depends(get_db)):
    """Bulk (re)ingestion: re-index MANY resumes in batches."""
    from app.models.models import ExtractedProfile
    from app.core.search import store as S
    items = []
    for r in db.query(Resume).all():
        ex = db.query(ExtractedProfile).filter_by(resume_id=r.id).first()
        items.append((r.id, ex.profile_json if ex else {}, r.raw_text or ""))
    return {"engine": "stored inverted index + BM25", **S.bulk_index(db, items)}
@router.patch("/candidates/{cid}/status")
def st(cid: str, d: dict, db: Session = Depends(get_db)):
    db.add(AdminAction(admin_id="admin", candidate_id=cid, action=d.get("status", ""), note=d.get("note", ""))); db.commit()
    return {"ok": True}
@router.post("/candidates/{cid}/notes")
def note(cid: str, d: dict, db: Session = Depends(get_db)):
    db.add(AdminAction(admin_id="admin", candidate_id=cid, action="note_added", note=d.get("note", ""))); db.commit()
    return {"ok": True}
@router.get("/jobs")
def jobs(db: Session = Depends(get_db)): return {"jobs": [{"id": j.id, "job_type": j.job_type, "status": j.status} for j in db.query(BackgroundJob).order_by(BackgroundJob.created_at.desc()).limit(50)]}
@router.post("/jobs/{jid}/retry")
def retry(jid: str, db: Session = Depends(get_db)):
    j = db.query(BackgroundJob).filter_by(id=jid).first()
    if j: j.status = "queued"; db.commit()
    return {"ok": True}
