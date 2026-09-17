"""Background job runner (§12: extraction/analysis/link/roadmap/pdf workers). Sync fallback — no broker needed."""
from sqlalchemy.orm import Session

def enqueue(db: Session, job_type: str, entity_type: str, entity_id: str) -> str:
    from app.models.models import BackgroundJob
    j = BackgroundJob(job_type=job_type, entity_type=entity_type, entity_id=entity_id, status="queued")
    db.add(j); db.commit(); db.refresh(j)
    # inline execution for local dev (async-first in prod via broker)
    try:
        run_inline(db, j)
    except Exception as e:
        j.status = "failed"; j.error_message = str(e)[:500]; db.commit()
    return j.id

def run_inline(db: Session, job) -> None:
    from app.models.models import BackgroundJob
    job.status = "running"; db.commit()
    if job.job_type == "extraction":
        import asyncio
        from app.api.v1.extraction import run_extraction
        out = asyncio.run(run_extraction(db, job.entity_id))
        job.result_json = {"status": "extracted", "links": len(out.get("links", []))}
    elif job.job_type == "analysis":
        from app.models.models import ExtractedProfile, AnalysisResult
        from app.core.analysis.engine import analyze
        ex = db.query(ExtractedProfile).filter_by(resume_id=job.entity_id).first()
        a = analyze(ex.profile_json if ex else {"resume_id": job.entity_id})
        rec = db.query(AnalysisResult).filter_by(resume_id=job.entity_id).first()
        if not rec:
            rec = AnalysisResult(resume_id=job.entity_id, overall_score=a["overall_score"], ats_score=a["ats_score"],
                                 role_fit_score=a["role_fit_score"], link_score=a["link_verification_score"], analysis_json=a)
            db.add(rec)
        else:
            rec.analysis_json = a
        job.result_json = {"overall": a["overall_score"]}
    elif job.job_type == "index":
        from app.models.models import ExtractedProfile, Resume
        from app.core.search import store as S
        r = db.query(Resume).filter_by(id=job.entity_id).first()
        ex = db.query(ExtractedProfile).filter_by(resume_id=job.entity_id).first()
        out = S.index_resume(db, job.entity_id, ex.profile_json if ex else {}, r.raw_text if r else "")
        job.result_json = out
    else:
        job.result_json = {"ok": True}
    job.status = "completed"; db.commit()
