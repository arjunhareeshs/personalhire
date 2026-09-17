import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import engine, Base
from app.models import models  # noqa
from app.api.v1 import auth, resumes, extraction, analysis, links, roadmap, builder, interview, admin
Base.metadata.create_all(bind=engine)
app = FastAPI(title="RViewer AI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
os.makedirs("uploads/pages", exist_ok=True)
app.mount("/pages", StaticFiles(directory="uploads/pages"), name="pages")
for r in [auth.router, resumes.router, extraction.router, analysis.router, links.router, roadmap.router, builder.router, interview.router, admin.router]:
    app.include_router(r, prefix="/api/v1")
@app.get("/health")
def health(): return {"ok": True, "service": "rviewer-ai"}
