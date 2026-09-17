import os
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import BuilderVersion, ExtractedProfile
from app.core.builder.engine import TEMPLATES, FONTS, get_template, improve_text, match_score, resume_score, profile_to_builder
from app.core.storage.pdf import make_pdf
router = APIRouter(prefix="/builder", tags=["builder"])

@router.get("/templates")
def templates(): return {"templates": TEMPLATES, "fonts": FONTS}

@router.post("/{rid}")
def create(rid: str, d: dict, db: Session = Depends(get_db)):
    ex = db.query(ExtractedProfile).filter_by(resume_id=rid).first()
    base = profile_to_builder(ex.profile_json if ex else {}, d.get("template_id", "cedar"))
    b = BuilderVersion(resume_id=rid, user_id="demo", template_id=base["template_id"],
                       version_name=d.get("version_name", "v1"),
                       content_json=base["content"], style_json=base["style"])
    db.add(b); db.commit(); db.refresh(b)
    return {"builder_id": b.id, **base}

@router.get("/{bid}")
def get(bid: str, db: Session = Depends(get_db)):
    b = db.query(BuilderVersion).filter_by(id=bid).first()
    if not b:
        return {"content": {}, "style": {}}
    return {"content": b.content_json, "style": b.style_json, "template_id": b.template_id,
            "score": resume_score(b.content_json or {})}

@router.patch("/{bid}")
def save(bid: str, d: dict, db: Session = Depends(get_db)):
    from app.schemas.schemas import BuilderSave
    v = BuilderSave(**{k: d[k] for k in ("content", "style", "section_order", "hidden_sections") if k in d})
    b = db.query(BuilderVersion).filter_by(id=bid).first()
    if b:
        if v.content is not None: b.content_json = v.content
        if v.style is not None:
            b.style_json = v.style
            if v.style.get("template_id"): b.template_id = v.style["template_id"]
        if v.section_order is not None: b.section_order = v.section_order
        if v.hidden_sections is not None: b.hidden_sections = v.hidden_sections
        db.commit()
    return {"ok": True, "score": resume_score((b.content_json if b else {}) or {}) if b else None}

@router.post("/{bid}/ai-improve")
async def improve(bid: str, d: dict):
    from app.core.ai.providers import chat
    txt = d.get("text", "")
    try:
        improved = await chat([{"role": "user", "content": f"Improve this resume bullet to be ATS-friendly with metrics: {txt}"}])
    except Exception:
        improved = improve_text(txt)
    return {"improved": improved if improved else improve_text(txt)}

@router.post("/{bid}/score")
def score(bid: str, d: dict, db: Session = Depends(get_db)):
    b = db.query(BuilderVersion).filter_by(id=bid).first()
    content = (d.get("content") or (b.content_json if b else {}) or {})
    out = resume_score(content)
    exps = content.get("experience", []) or []
    target = content.get("target_role", "")
    out["match_scores"] = [match_score(" ".join(e.get("bullets", [])), target) for e in exps]
    return out

@router.post("/{bid}/feedback")
async def feedback(bid: str, d: dict, db: Session = Depends(get_db)):
    from app.core.ai.providers import chat
    b = db.query(BuilderVersion).filter_by(id=bid).first()
    content = (b.content_json if b else {}) or {}
    sc = resume_score(content)
    failed = [c for c in sc["checks"] if not c["ok"]]
    prompt = f"Give 5 short resume feedback points. Score {sc['score']}. Failing: {[c['label'] for c in failed]}. Target role: {content.get('target_role', '')}."
    try:
        txt = await chat([{"role": "user", "content": prompt}])
        points = [l.strip("-• ").strip() for l in txt.splitlines() if l.strip()][:6] or [txt[:300]]
    except Exception:
        points = [c["fix"] for c in failed][:5] or ["Resume looks strong — keep bullets metric-driven."]
    return {"score": sc["score"], "feedback": points, "checks": sc["checks"]}

@router.post("/{bid}/export-pdf")
def export(bid: str, db: Session = Depends(get_db)):
    b = db.query(BuilderVersion).filter_by(id=bid).first()
    c = (b.content_json if b else {}) or {}
    t = get_template((b.template_id if b else "cedar"))
    p = c.get("personal", {}) or {}
    lines = [f"[{t['name']}] {p.get('name', 'Resume')} — {p.get('headline', '')}",
             p.get("email", ""), str(content_summary(c)),
             "EXPERIENCE"] + [f"- {bl}" for e in (c.get("experience", []) or []) for bl in (e.get("bullets", []) or [])][:30]
    path = f"data/outputs/{bid}.pdf"
    make_pdf(path, f"{p.get('name', 'Resume')} ({t['name']})", lines)
    if b:
        b.export_pdf_path = path; db.commit()
    return {"pdf_url": f"/api/v1/builder/{bid}/exports"}

def content_summary(c: dict) -> str:
    return (c.get("summary", "") or "")[:400]

@router.get("/{bid}/exports")
def hist(bid: str):
    return FileResponse(f"data/outputs/{bid}.pdf") if os.path.exists(f"data/outputs/{bid}.pdf") else {"detail": "no export yet"}
