"""Ranking: BM25 over field-weighted tf + phrase bonus + fuzzy (edit-distance-1)
expansion against the stored vocabulary. All reads come from the stored index."""
import math
from sqlalchemy.orm import Session
from app.models.models import SearchTerm, SearchDocument
from app.core.search import nlp, store

K1, B = 1.5, 0.75

def _edits1(w: str) -> set[str]:
    out = set()
    for i in range(len(w)):
        out.add(w[:i] + w[i + 1:])  # delete
        for ch in "abcdefghijklmnopqrstuvwxyz0123456789":
            out.add(w[:i] + ch + w[i + 1:])  # substitute
            out.add(w[:i] + ch + w[i:])  # insert
    return out

def expand_fuzzy(db: Session, terms: list[str]) -> dict[str, list[str]]:
    """Map each query term -> itself + vocab neighbours within edit distance 1."""
    vocab = {r[0] for r in db.query(SearchTerm.term).distinct().all()}
    out = {}
    for t in terms:
        if t in vocab:
            out[t] = [t]
            continue
        cands = [v for v in _edits1(t) if v in vocab][:3]
        out[t] = [t, *cands]
    return out

def _phrase_hit(pos_lists: list[list[int]]) -> bool:
    if any(not p for p in pos_lists):
        return False
    first, rest = set(pos_lists[0]), [set(p) for p in pos_lists[1:]]
    return any(all((x + i + 1) in rest[i] for i in range(len(rest))) for x in first)

def search(db: Session, query: str, resume_ids: list[str] | None = None, top_k: int = 20) -> list[dict]:
    """BM25 search over the STORED index. Never scans resume text."""
    pq = nlp.parse_query(query)
    if not pq["terms"] and not pq["phrases"]:
        return []
    stats = store.collection_stats(db)
    N = max(1, stats["documents"])
    avglen = stats["avg_length"] or 500.0
    expanded = expand_fuzzy(db, pq["terms"])
    all_terms = sorted({v for vs in expanded.values() for v in vs})
    df = store.doc_freq(db, all_terms)
    idf = {t: math.log(1 + (N - df.get(t, 0) + 0.5) / (df.get(t, 0) + 0.5)) for t in all_terms}

    q = db.query(SearchTerm).filter(SearchTerm.term.in_(all_terms))
    if resume_ids is not None:
        q = q.filter(SearchTerm.resume_id.in_(resume_ids))
    postings = q.all()
    by_doc: dict[str, dict] = {}
    for p in postings:
        by_doc.setdefault(p.resume_id, {})[p.term] = p

    # phrase positions per doc (also seeds docs matched ONLY by phrase)
    phrase_terms = sorted({t for ph in pq["phrases"] for t in ph})
    phrase_post: dict[str, dict] = {}
    if phrase_terms:
        qp = db.query(SearchTerm).filter(SearchTerm.term.in_(phrase_terms))
        if resume_ids is not None:
            qp = qp.filter(SearchTerm.resume_id.in_(resume_ids))
        for p in qp.all():
            phrase_post.setdefault(p.resume_id, {})[p.term] = p.positions_json or []
            by_doc.setdefault(p.resume_id, {})

    docs = {d.resume_id: d for d in db.query(SearchDocument).filter(
        SearchDocument.resume_id.in_(list(by_doc))).all()} if by_doc else {}

    results = []
    for rid, terms in by_doc.items():
        length = (docs.get(rid).length if docs.get(rid) else 500) or 1
        score, matched = 0.0, []
        for orig, variants in expanded.items():
            best = 0.0
            for v in variants:
                post = terms.get(v)
                if not post:
                    continue
                tf = post.tf_w
                s = idf.get(v, 0) * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * length / avglen))
                if v != orig:
                    s *= 0.6  # fuzzy penalty
                best = max(best, s)
            if best:
                matched.append(orig)
                score += best
        for ph in pq["phrases"]:
            pl = [phrase_post.get(rid, {}).get(t, []) for t in ph]
            if _phrase_hit(pl):
                score += 2.5 * len(ph)
                matched.extend(t for t in ph if t not in matched)
        if score:
            results.append({"resume_id": rid, "score": round(score, 3), "matched_terms": matched,
                            "fields": sorted({f for t in matched for post in [terms.get(t)] if post for f in (post.fields_json or {})})})
    results.sort(key=lambda r: -r["score"])
    return results[:top_k]

def snippet(db: Session, resume_id: str, matched: list[str], raw_text: str, profile: dict) -> str:
    """Best 280-char window from stored fields/raw around a matched term."""
    from app.core.search.store import extract_fields
    blob = " ".join(extract_fields(profile, raw_text).values())
    low = blob.lower()
    idx = min([low.find(t) for t in matched if t in low] or [0])
    start = max(0, idx - 90)
    return ("…" if start else "") + blob[start:start + 280]
