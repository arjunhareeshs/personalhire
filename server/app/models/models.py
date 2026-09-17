import uuid, datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, Float, DateTime, ForeignKey, JSON
from app.db.database import Base
def uid(): return str(uuid.uuid4())
def now(): return datetime.datetime.utcnow()
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=uid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")
    status = Column(String, default="active")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class Resume(Base):
    __tablename__ = "resumes"
    id = Column(String, primary_key=True, default=uid)
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    page_count = Column(Integer, default=1)
    raw_text = Column(Text, default="")
    status = Column(String, default="uploaded")
    active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class ExtractedProfile(Base):
    __tablename__ = "extracted_profiles"
    id = Column(String, primary_key=True, default=uid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    profile_json = Column(JSON, nullable=False)
    confidence_json = Column(JSON, default={})
    missing_fields = Column(JSON, default=[])
    warnings = Column(JSON, default=[])
    confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(String, primary_key=True, default=uid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    overall_score = Column(Integer, default=0)
    ats_score = Column(Integer, default=0)
    role_fit_score = Column(Integer, default=0)
    link_score = Column(Integer, default=0)
    analysis_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class ResumeLink(Base):
    __tablename__ = "resume_links"
    id = Column(String, primary_key=True, default=uid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    url = Column(Text, nullable=False)
    normalized_url = Column(Text, default="")
    platform = Column(String, default="other")
    link_type = Column(String, default="other")
    source = Column(String, default="visible_text")
    page_number = Column(Integer, default=1)
    verification_status = Column(String, default="pending")
    intelligence_json = Column(JSON, default={})
    last_checked_at = Column(DateTime, default=now)
    created_at = Column(DateTime, default=now)
class Roadmap(Base):
    __tablename__ = "roadmaps"
    id = Column(String, primary_key=True, default=uid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    target_role = Column(String, nullable=False)
    duration_months = Column(Integer, default=6)
    roadmap_json = Column(JSON, nullable=False)
    progress_json = Column(JSON, default={})
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class BuilderVersion(Base):
    __tablename__ = "builder_versions"
    id = Column(String, primary_key=True, default=uid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    user_id = Column(String, ForeignKey("users.id"))
    template_id = Column(String, default="modern-pro")
    version_name = Column(String, default="v1")
    content_json = Column(JSON, nullable=False)
    style_json = Column(JSON, default={})
    section_order = Column(JSON, default=[])
    hidden_sections = Column(JSON, default=[])
    export_pdf_path = Column(String, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(String, primary_key=True, default=uid)
    user_id = Column(String, ForeignKey("users.id"))
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    room_name = Column(String, unique=True, nullable=False)
    candidate_name = Column(String, nullable=False)
    target_role = Column(String, default="")
    status = Column(String, default="created")
    current_phase = Column(String, default="introduction")
    exchange_count = Column(Integer, default=0)
    start_time = Column(DateTime, default=now)
    end_time = Column(DateTime, nullable=True)
    evaluation_json = Column(JSON, default=None)
    report_pdf_path = Column(String, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class InterviewMessage(Base):
    __tablename__ = "interview_messages"
    id = Column(String, primary_key=True, default=uid)
    session_id = Column(String, ForeignKey("interview_sessions.id"))
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    phase = Column(String, default="introduction")
    timestamp = Column(DateTime, default=now)
    audio_duration_seconds = Column(Float, default=0)
    transcription_confidence = Column(Float, default=1.0)
class AdminAction(Base):
    __tablename__ = "admin_actions"
    id = Column(String, primary_key=True, default=uid)
    admin_id = Column(String, ForeignKey("users.id"))
    candidate_id = Column(String, ForeignKey("users.id"))
    action = Column(String, nullable=False, index=True)
    note = Column(Text, default="")
    # DB column stays `metadata` per spec §14.11; attr avoids Declarative clash
    metadata_json = Column("metadata", JSON, default={})
    created_at = Column(DateTime, default=now)
class InterviewReport(Base):
    """Separate report row per ER diagram (§14.1) + §15 ORM list."""
    __tablename__ = "interview_reports"
    id = Column(String, primary_key=True, default=uid)
    session_id = Column(String, ForeignKey("interview_sessions.id"), unique=True)
    evaluation_json = Column(JSON, default={})
    radar_json = Column(JSON, default={})
    report_pdf_path = Column(String, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class BackgroundJob(Base):
    __tablename__ = "background_jobs"
    id = Column(String, primary_key=True, default=uid)
    job_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    status = Column(String, default="queued")
    attempts = Column(Integer, default=0)
    error_message = Column(Text, default="")
    result_json = Column(JSON, default={})
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now)
class SearchDocument(Base):
    """One row per indexed resume: length stats for BM25 (stored index)."""
    __tablename__ = "search_documents"
    resume_id = Column(String, primary_key=True)
    length = Column(Integer, default=0)
    term_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=now)
class SearchTerm(Base):
    """Inverted index posting: field-weighted tf + capped positions per (term, resume)."""
    __tablename__ = "search_terms"
    id = Column(String, primary_key=True, default=uid)
    term = Column(String, nullable=False, index=True)
    resume_id = Column(String, nullable=False, index=True)
    tf_w = Column(Float, default=0.0)
    fields_json = Column(JSON, default={})
    positions_json = Column(JSON, default=[])
