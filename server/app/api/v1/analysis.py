from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import ExtractedProfile, AnalysisResult
from app.core.analysis.engine import analyze
router = APIRouter(prefix="/analysis", tags=["analysis"])
def get_profile(db, rid):
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    return (ex.profile_json if ex else {"resume_id": rid, "personal_information": {"email": ""}, "skills": {"technical_skills": ["React"]}, "projects": [], "portfolio_links": []})
@router.post("/{rid}/start")
def start(rid: str, db: Session = Depends(get_db)):
    a = analyze(get_profile(db, rid))
    rec = db.query(AnalysisResult).filter_by(resume_id=rid).first()
    if not rec: rec = AnalysisResult(resume_id=rid, overall_score=a["overall_score"], ats_score=a["ats_score"], role_fit_score=a["role_fit_score"], link_score=a["link_verification_score"], analysis_json=a); db.add(rec)
    else: rec.analysis_json = a; rec.overall_score = a["overall_score"]; rec.ats_score = a["ats_score"]
    db.commit(); return a
@router.get("/{rid}")
def get(rid: str, db: Session = Depends(get_db)):
    rec = db.query(AnalysisResult).filter_by(resume_id=rid).first()
    return rec.analysis_json if rec else analyze(get_profile(db, rid))
@router.get("/{rid}/dashboard")
def dash(rid: str, db: Session = Depends(get_db)): return get(rid, db)
@router.get("/{rid}/ats")
def ats(rid: str, db: Session = Depends(get_db)): return {"ats": get(rid, db).get("ats_score")}
@router.get("/{rid}/skills")
def skills(rid: str, db: Session = Depends(get_db)): return {"skills": get(rid, db).get("skills")}
@router.get("/{rid}/projects")
def proj(rid: str, db: Session = Depends(get_db)): return {"projects": get(rid, db).get("project_analysis")}
@router.get("/{rid}/roles")
def roles(rid: str, db: Session = Depends(get_db)): return {"roles": get(rid, db).get("role_recommendations")}
