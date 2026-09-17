"""Tiny file-backed vector index (FAISS/Qdrant-compatible hook).
Interview RAG: chunk resume text → token-overlap retrieval. Swap with Qdrant in prod."""
import os, re, json
from app.core.storage.store import BASE

def _path(room: str) -> str:
    d = os.path.join(BASE, "vector_store", room)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, "index.json")

def index_text(room: str, text: str) -> int:
    chunks = [c.strip() for c in re.split(r"\n{2,}", text or "") if c.strip()][:60]
    json.dump(chunks, open(_path(room), "w"))
    return len(chunks)

def retrieve(room: str, query: str, k: int = 3) -> list[str]:
    try:
        chunks = json.load(open(_path(room)))
    except Exception:
        return []
    qw = set(re.findall(r"\w+", (query or "").lower()))
    scored = sorted(chunks, key=lambda c: -len(qw & set(re.findall(r"\w+", c.lower()))))
    return scored[:k]
