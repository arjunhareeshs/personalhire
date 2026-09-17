"""Extraction API — full pipeline: validate→metadata→links→text→images→VLM→normalize→confidence→store."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Resume, ExtractedProfile, ResumeLink
from app.core.extraction import pipeline as P
router = APIRouter(prefix="/extraction", tags=["extraction"])

async def run_extraction(db: Session, rid: str):
    r = db.query(Resume).filter_by(id=rid).first()
    fname = r.filename if r else "resume.pdf"
    # raw bytes
    try:
        data = open(r.file_path, "rb").read() if r and r.file_path else b""
    except Exception:
        data = b""
    if not data:
        data = (r.raw_text if r else "").encode(errors="ignore") or b"Demo resume React FastAPI demo@student.ai https://github.com/demo https://leetcode.com/demo"
    meta = P.extract_metadata(fname, data, P.validate_file(fname, data)["ext"] or "pdf")
    text_layer = P.native_text(data, meta["file_type"])
    full_text = text_layer["native_pdf_text"] or text_layer["docx_text"] or ""
    links = P.extract_links(data, full_text, meta["file_type"], meta)
    rendered_pages = P.render_page_images(data, meta["file_type"], rid)
    pages = rendered_pages or P.page_images_manifest(rid, meta.get("number_of_pages", 1))
    vlm = None
    if rendered_pages:
        try:
            vlm = await P.vlm_extract_profile(rendered_pages)
        except Exception as e:
            vlm = None
            text_layer["extraction_error"] = (text_layer.get("extraction_error", "") + f" | VLM extraction failed: {e}").strip(" |")
    if not vlm:
        vlm = P.vlm_parse(full_text)
    if text_layer.get("extraction_error"):
        vlm.setdefault("page_errors", []).append(text_layer["extraction_error"])
    profile, conf = P.normalize_profile(vlm, links, rid, fname)
    profile["file_metadata"] = {**meta, "resume_id": rid}
    if r:
        r.page_count = meta.get("number_of_pages", 1)
        if not r.raw_text:
            r.raw_text = full_text[:20000]
        r.status = "extracted"
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    if not ex:
        ex = ExtractedProfile(resume_id=rid, profile_json=profile, confidence_json=conf,
                              missing_fields=profile["missing_fields"], warnings=profile["warnings"])
        db.add(ex)
    else:
        ex.profile_json = profile
        ex.confidence_json = conf
        ex.missing_fields = profile["missing_fields"]
        ex.warnings = profile["warnings"]
    for l in links:
        if not db.query(ResumeLink).filter_by(resume_id=rid, url=l["url"]).first():
            db.add(ResumeLink(resume_id=rid, url=l["url"], normalized_url=l["normalized_url"],
                              platform=l["platform"], link_type=l["link_type"], source=l["source"],
                              page_number=l["page_number"], verification_status="pending",
                              intelligence_json={"anchor_text": l.get("anchor_text", "")}))
    db.commit()
    # ingestion hook: (re)build the STORED search index for this resume
    try:
        from app.core.search import store as S
        S.index_resume(db, rid, profile, full_text)
    except Exception:
        pass
    return {"profile": profile, "confidence": conf, "metadata": meta, "links": links,
            "pages": pages, "text_evidence_chars": len(full_text)}

@router.post("/{rid}/start")
async def start(rid: str, db: Session = Depends(get_db)):
    out = await run_extraction(db, rid)
    return {"profile": out["profile"], "status": "extracted", "metadata": out["metadata"],
            "pages": out["pages"], "links_found": len(out["links"])}

@router.get("/{rid}/status")
def status(rid: str, db: Session = Depends(get_db)):
    r = db.query(Resume).filter_by(id=rid).first()
    return {"status": r.status if r else "extracted",
            "timeline": ["uploaded", "metadata", "links", "text", "page_images", "vlm", "normalized"]}

@router.get("/{rid}")
async def get(rid: str, db: Session = Depends(get_db)):
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    if not ex:
        out = await run_extraction(db, rid)
        return {"profile_json": out["profile"], "confidence": out["confidence"],
                "metadata": out["metadata"], "pages": out["pages"], "confirmed": False}
    r = db.query(Resume).filter_by(id=rid).first()
    return {"profile_json": ex.profile_json, "confidence": ex.confidence_json or {},
            "missing_fields": ex.missing_fields or [], "warnings": ex.warnings or [],
            "metadata": (ex.profile_json or {}).get("file_metadata", {}),
            "pages": P.page_images_manifest(rid, (r.page_count if r else 1) or 1),
            "confirmed": ex.confirmed}

@router.patch("/{rid}")
def patch(rid: str, d: dict, db: Session = Depends(get_db)):
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    if ex:
        ex.profile_json = d.get("profile_json", d)
        db.commit()
        try:
            from app.core.search import store as S
            r = db.query(Resume).filter_by(id=rid).first()
            S.index_resume(db, rid, ex.profile_json, r.raw_text if r else "")
        except Exception:
            pass
    return {"ok": True, "reindexed": True}

@router.post("/{rid}/confirm")
def confirm(rid: str, db: Session = Depends(get_db)):
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    if ex:
        ex.confirmed = True
        db.commit()
    r = db.query(Resume).filter_by(id=rid).first()
    if r:
        r.status = "confirmed"
        db.commit()
    return {"confirmed": True, "next": "analysis"}
