"""File storage layout (§10 data storage): uploads / page_images / vector_store / outputs."""
import os
BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data")
UPLOADS = os.path.join(os.path.dirname(BASE), "uploads")
for p in [UPLOADS, os.path.join(BASE, "page_images"), os.path.join(BASE, "vector_store"), os.path.join(BASE, "outputs")]:
    os.makedirs(p, exist_ok=True)

def output_path(name: str) -> str:
    return os.path.join(BASE, "outputs", name)
