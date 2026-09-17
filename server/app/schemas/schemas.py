"""Pydantic schemas — validate every AI JSON before DB save (§15 ORM rules)."""
from pydantic import BaseModel, Field
from typing import Any

class ProfileConfirm(BaseModel):
    profile_json: dict[str, Any]

class AnalysisOut(BaseModel):
    resume_id: str
    overall_score: int = Field(ge=0, le=100)
    ats_score: int = Field(ge=0, le=100)
    role_fit_score: int = Field(ge=0, le=100)
    link_verification_score: int = Field(ge=0, le=100)
    ai_summary: str = ""

class RoadmapGen(BaseModel):
    target_role: str

class BuilderSave(BaseModel):
    content: dict[str, Any] | None = None
    style: dict[str, Any] | None = None
    section_order: list[str] | None = None
    hidden_sections: list[str] | None = None

class InterviewStart(BaseModel):
    resume_id: str | None = None
    target_role: str = "Full Stack Developer"
    candidate_name: str = "Candidate"
    duration_minutes: int = 10

class AdminStatus(BaseModel):
    status: str
    note: str = ""

class AdminNote(BaseModel):
    note: str

class NLSearch(BaseModel):
    query: str
