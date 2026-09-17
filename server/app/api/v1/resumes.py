import os
from fastapi import APIRouter, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Resume, BackgroundJob
from app.core.extraction.pipeline import validate_file, file_hash
router = APIRouter(prefix="/resumes", tags=["resumes"])
UP = "uploads"
os.makedirs(UP, exist_ok=True)

@router.post("/upload")
async def upload(file: UploadFile, db: Session = Depends(get_db)):
    b = await file.read()
    v = validate_file(file.filename, b)
    if not v["valid"]:
        raise HTTPException(400, "; ".join(v["errors"]))
    h = file_hash(b)
    dup = db.query(Resume).filter_by(file_hash=h).first()
    if dup:
        return {"resume_id": dup.id, "duplicate": True, "status": dup.status, "message": "Duplicate detected by file hash — reusing existing extraction."}
    path = os.path.join(UP, f"{h[:12]}_{file.filename}")
    open(path, "wb").write(b)
    # deactivate old versions, keep history
    for old in db.query(Resume).filter_by(user_id="demo", active=True).all():
        old.active = False
    r = Resume(user_id="demo", filename=file.filename, file_path=path, file_hash=h,
               file_type=v["ext"], raw_text=b[:20000].decode(errors="ignore"),
               status="uploaded", active=True)
    db.add(r); db.commit(); db.refresh(r)
    db.add(BackgroundJob(job_type="extraction", entity_type="resume", entity_id=r.id, status="queued")); db.commit()
    return {"resume_id": r.id, "status": "uploaded", "validation": v,
            "processing": ["validate", "store", "metadata", "links", "page_images", "vlm", "normalize"]}

@router.get("")
def lst(db: Session = Depends(get_db)):
    rows = db.query(Resume).order_by(Resume.created_at.desc()).limit(50).all()
    return {"resumes": [{"id": r.id, "filename": r.filename, "status": r.status, "active": r.active,
                         "created_at": str(r.created_at), "version": r.id[:8]} for r in rows],
            "versions": len(rows)}

@router.get("/{rid}")
def get(rid: str, db: Session = Depends(get_db)):
    r = db.query(Resume).filter_by(id=rid).first()
    if not r:
        return {"id": rid, "demo": True}
    hist = db.query(Resume).filter_by(user_id=r.user_id).order_by(Resume.created_at.desc()).all()
    return {"id": r.id, "filename": r.filename, "status": r.status, "active": r.active,
            "page_count": r.page_count, "versions": [{"id": x.id, "filename": x.filename, "created_at": str(x.created_at)} for x in hist]}

@router.get("/{rid}/file")
def dl(rid: str, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse
    r = db.query(Resume).filter_by(id=rid).first()
    return FileResponse(r.file_path) if r and r.file_path and os.path.exists(r.file_path) else {"detail": "not found"}
