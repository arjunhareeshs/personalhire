"""Stored inverted index: per-resume field-weighted postings persisted in
SearchDocument/SearchTerm. Incremental (one resume) + bulk (batched, many resumes)."""
from sqlalchemy.orm import Session
from app.models.models import SearchDocument, SearchTerm
from app.core.search import nlp

# field → weight (skills dominate, raw text supports)
FIELDS = {
    "personal": 1.5, "skills": 3.0, "projects": 2.0, "experience": 2.0,
    "education": 1.0, "certifications": 1.2, "links": 1.0, "raw": 0.8,
}

def extract_fields(profile: dict, raw_text: str) -> dict[str, str]:
    p = profile or {}
    pi = p.get("personal_information", {}) or {}
    sk = p.get("skills", {}) or {}
    return {
        "personal": " ".join(str(x) for x in pi.values() if x),
        "skills": " ".join(" ".join(v) for v in sk.values() if isinstance(v, list)),
        "projects": " ".join(f"{x.get('project_title', '')} {x.get('description', '')} {' '.join(x.get('tech_stack', []) or [])}" for x in (p.get("projects", []) or [])),
        "experience": " ".join(f"{x.get('role_title', '')} {x.get('company_name', '')} {' '.join(x.get('responsibilities', []) or [])}" for x in (p.get("work_experience", []) or [])),
        "education": " ".join(f"{x.get('institution_name', '')} {x.get('degree', '')} {x.get('field_of_study', '')}" for x in (p.get("education", []) or [])),
        "certifications": " ".join(str(x.get("certification_name", "")) for x in (p.get("certifications", []) or [])),
        "links": " ".join(f"{l.get('url', '')} {l.get('platform', '')}" for l in (p.get("portfolio_links", []) or [])),
        "raw": (raw_text or "")[:20000],
    }

def index_resume(db: Session, resume_id: str, profile: dict, raw_text: str) -> dict:
    """(Re)build the stored index for ONE resume. Old postings deleted first."""
    fields = extract_fields(profile, raw_text)
    postings: dict[str, dict] = {}  # term -> {tf_w, fields:{f:tf}, pos:[...]}
    length = 0
    for fname, text in fields.items():
        toks = nlp.analyze(text)
        length += len(toks)
        for pos, tok in enumerate(toks):
            e = postings.setdefault(tok, {"tf_w": 0.0, "fields": {}, "pos": []})
            e["tf_w"] += FIELDS[fname]
            e["fields"][fname] = e["fields"].get(fname, 0) + 1
            if len(e["pos"]) < 40:
                e["pos"].append(pos)
    db.query(SearchTerm).filter_by(resume_id=resume_id).delete()
    for term, e in postings.items():
        db.add(SearchTerm(resume_id=resume_id, term=term, tf_w=e["tf_w"],
                          fields_json=e["fields"], positions_json=e["pos"]))
    doc = db.query(SearchDocument).filter_by(resume_id=resume_id).first()
    if not doc:
        doc = SearchDocument(resume_id=resume_id, length=length, term_count=len(postings))
        db.add(doc)
    else:
        doc.length = length
        doc.term_count = len(postings)
    db.commit()
    return {"resume_id": resume_id, "terms": len(postings), "length": length}

def delete_resume(db: Session, resume_id: str) -> None:
    db.query(SearchTerm).filter_by(resume_id=resume_id).delete()
    db.query(SearchDocument).filter_by(resume_id=resume_id).delete()
    db.commit()

def bulk_index(db: Session, items: list[tuple[str, dict, str]], batch: int = 50) -> dict:
    """Index MANY resumes in batches (bulk ingestion). Items: (resume_id, profile, raw)."""
    done, terms = 0, 0
    for i in range(0, len(items), batch):
        for rid, prof, raw in items[i:i + batch]:
            try:
                r = index_resume(db, rid, prof, raw)
                done += 1
                terms += r["terms"]
            except Exception:
                db.rollback()
    return {"indexed": done, "of": len(items), "terms": terms}

def collection_stats(db: Session) -> dict:
    docs = db.query(SearchDocument).all()
    n = len(docs)
    return {"documents": n, "avg_length": round(sum(d.length for d in docs) / n, 1) if n else 0,
            "vocab": db.query(SearchTerm.term).distinct().count()}

def doc_freq(db: Session, terms: list[str]) -> dict[str, int]:
    from sqlalchemy import func
    rows = db.query(SearchTerm.term, func.count(SearchTerm.resume_id.distinct())).filter(
        SearchTerm.term.in_(terms)).group_by(SearchTerm.term).all() if terms else []
    return {t: c for t, c in rows}
