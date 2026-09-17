from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import ExtractedProfile, Roadmap
from app.core.roadmap.generator import generate
router = APIRouter(prefix="/roadmap", tags=["roadmap"])
@router.post("/{rid}/generate")
def gen(rid: str, d: dict, db: Session = Depends(get_db)):
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    prof = ex.profile_json if ex else {"resume_id": rid, "skills": {"technical_skills": []}}
    r = generate(prof, d.get("target_role", "Full Stack Developer"))
    rec = Roadmap(resume_id=rid, target_role=r["target_role"], roadmap_json=r); db.add(rec); db.commit(); db.refresh(rec)
    return {"roadmap_id": rec.id, **r}
@router.get("/{rid}")
def get(rid: str, db: Session = Depends(get_db)):
    rec = db.query(Roadmap).filter_by(resume_id=rid).order_by(Roadmap.created_at.desc()).first()
    if rec:
        return {"roadmap_id": rec.id, "progress": rec.progress_json or {}, **rec.roadmap_json}
    return {"roadmap_id": None, "progress": {}, **generate({"resume_id": rid, "skills": {"technical_skills": ["React"]}}, "Full Stack Developer")}
@router.patch("/{mid}/progress")
def prog(mid: str, d: dict, db: Session = Depends(get_db)):
    rec = db.query(Roadmap).filter_by(id=mid).first()
    if rec: rec.progress_json = d; db.commit()
    return {"ok": True}
@router.post("/{mid}/regenerate")
def regen(mid: str, d: dict, db: Session = Depends(get_db)):
    rec = db.query(Roadmap).filter_by(id=mid).first()
    if not rec:
        return {"ok": False}
    ex = db.query(ExtractedProfile).filter_by(resume_id=rec.resume_id).first()
    prof = ex.profile_json if ex else {"resume_id": rec.resume_id, "skills": {"technical_skills": []}}
    r = generate(prof, d.get("target_role", rec.target_role))
    rec.target_role = r["target_role"]; rec.roadmap_json = r; rec.progress_json = {}
    db.commit()
    return {"roadmap_id": rec.id, "progress": {}, **r}
