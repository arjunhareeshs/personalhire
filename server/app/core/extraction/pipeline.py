"""Deep extraction pipeline per docs-v2/02 sections 2.1-2.9 + 3.x JSON."""
import hashlib, re, os, io, json, base64
from urllib.parse import urlparse, urlunparse
from app.core.ai import providers as AI

CANON = {
    "js": "JavaScript", "javascript": "JavaScript", "ts": "TypeScript", "typescript": "TypeScript",
    "node": "Node.js", "nodejs": "Node.js", "reactjs": "React", "react": "React",
    "postgres": "PostgreSQL", "postgresql": "PostgreSQL", "mongo": "MongoDB", "mongodb": "MongoDB",
    "py": "Python", "python": "Python", "sklearn": "Scikit-learn", "scikit learn": "Scikit-learn",
    "tf": "TensorFlow", "tensorflow": "TensorFlow", "k8s": "Kubernetes",
}
TECH_SKILLS = {"javascript", "typescript", "python", "java", "c++", "go", "react", "node.js", "fastapi",
               "django", "flask", "postgresql", "mongodb", "mysql", "redis", "docker", "kubernetes", "aws",
               "azure", "tensorflow", "pytorch", "scikit-learn", "pandas", "sql", "graphql", "figma"}
SOFT_SKILLS = {"communication", "teamwork", "leadership", "problem solving", "adaptability", "time management"}

def file_hash(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

# ---------- 2.1 validation ----------
def validate_file(filename: str, data: bytes) -> dict:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    errs = []
    if ext not in ("pdf", "docx"):
        errs.append("Unsupported file type. Only PDF/DOCX allowed.")
    if len(data) == 0:
        errs.append("Empty file.")
    if len(data) > 10 * 1024 * 1024:
        errs.append("File too large (max 10MB).")
    if ext == "pdf" and data[:5] not in (b"%PDF-",):
        # allow demo text but flag
        if len(data) < 20:
            errs.append("Corrupted file.")
    if b"/Encrypt" in data[:5000]:
        errs.append("Password-protected PDF not supported.")
    if len(data.strip()) < 50:
        errs.append("Resume appears empty — no readable content.")
    return {"valid": not errs, "errors": errs, "ext": ext, "size": len(data)}

# ---------- 2.2 metadata ----------
def extract_metadata(filename: str, data: bytes, ext: str) -> dict:
    meta = {"file_name": filename, "file_size": len(data), "file_type": ext,
            "number_of_pages": 1, "pdf_title": "", "pdf_author": "", "pdf_creator": "",
            "pdf_producer": "", "created_date": "", "modified_date": "", "embedded_fonts": [],
            "selectable_text_available": False, "scanned_or_image_based": False,
            "embedded_hyperlink_available": False, "annotation_available": False,
            "form_field_available": False, "pdf_language": ""}
    try:
        if ext == "pdf":
            from PyPDF2 import PdfReader
            import io
            r = PdfReader(io.BytesIO(data))
            meta["number_of_pages"] = len(r.pages)
            info = r.metadata or {}
            meta["pdf_title"] = str(info.get("/Title", "") or "")
            meta["pdf_author"] = str(info.get("/Author", "") or "")
            meta["pdf_creator"] = str(info.get("/Creator", "") or "")
            meta["pdf_producer"] = str(info.get("/Producer", "") or "")
            txt = ""
            for p in r.pages[:5]:
                try:
                    txt += p.extract_text() or ""
                except Exception:
                    pass
                annots = p.get("/Annots")
                if annots:
                    meta["annotation_available"] = True
                    for a in annots:
                        try:
                            o = a.get_object()
                            if "/A" in o:
                                meta["embedded_hyperlink_available"] = True
                        except Exception:
                            pass
            meta["selectable_text_available"] = len(txt.strip()) > 100
            meta["scanned_or_image_based"] = not meta["selectable_text_available"]
            if "/AcroForm" in str(r.trailer.get("/Root", "")):
                meta["form_field_available"] = True
            try:
                fonts = set()
                for p in r.pages[:3]:
                    res = p.get("/Resources", {}).get("/Font", {})
                    for f in (res.keys() if hasattr(res, "keys") else []):
                        fonts.add(str(f))
                meta["embedded_fonts"] = sorted(fonts)[:10]
            except Exception:
                pass
        elif ext == "docx":
            meta["number_of_pages"] = max(1, len(data) // 8000)
            meta["selectable_text_available"] = True
    except Exception as e:
        meta["warnings"] = [f"metadata partial: {e}"]
    return meta

# ---------- 2.3 embedded + visible links ----------
def normalize_url(u: str) -> str:
    u = (u or "").strip().rstrip(".,;)")
    if not u:
        return u
    if u.lower().startswith("mailto:"):
        return u.split(":", 1)[1].strip().lower()
    if u.lower().startswith("tel:"):
        return re.sub(r"\D", "", u.split(":", 1)[1])
    if not re.match(r"https?://", u, re.I):
        u = "https://" + u
    try:
        p = urlparse(u)
        netloc = p.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return urlunparse((p.scheme.lower(), netloc, p.path.rstrip("/"), "", "", ""))
    except Exception:
        return u

PLATFORM_DOMAINS = ["github.com", "gitlab.com", "bitbucket.org", "linkedin.com", "leetcode.com",
                    "hackerrank.com", "hackerearth.com", "codeforces.com", "codechef.com", "kaggle.com",
                    "stackoverflow.com", "medium.com", "dev.to", "behance.net", "dribbble.com",
                    "youtube.com", "drive.google.com", "researchgate.net", "orcid.org", "scholar.google.com",
                    "vercel.app", "netlify.app", "render.com", "railway.app", "figma.com", "canva.com",
                    "hashnode.com", "twitter.com", "x.com", "instagram.com", "facebook.com", "t.me",
                    "telegram.me", "discord.gg", "discord.com", "reddit.com", "twitch.tv", "substack.com",
                    "threads.net", "tiktok.com", "credly.com", "wellfound.com", "angel.co", "notion.site",
                    "coursera.org", "udemy.com", "producthunt.com"]

def classify_platform(url: str) -> str:
    u = (url or "").lower()
    if u.startswith("mailto:"):
        return "email"
    if u.startswith("tel:"):
        return "phone"
    for p in ["github", "gitlab", "bitbucket", "linkedin", "leetcode", "hackerrank", "hackerearth",
              "codeforces", "codechef", "kaggle", "stackoverflow", "medium", "dev.to", "behance",
              "dribbble", "youtube", "drive.google", "researchgate", "orcid", "scholar.google",
              "vercel", "netlify", "render", "railway", "figma", "canva", "hashnode",
              "twitter", "x.com", "instagram", "facebook", "t.me", "telegram", "discord", "reddit",
              "twitch", "substack", "threads", "tiktok", "credly", "wellfound", "angel.co", "notion",
              "coursera", "udemy", "producthunt"]:
        if p in u:
            return p.replace(".", "_").replace("drive_google", "google_drive")
    if "portfolio" in u or "vercel.app" in u or "netlify.app" in u:
        return "portfolio"
    return "other"

def extract_links(data: bytes, text: str, ext: str, meta: dict) -> list:
    links = []
    t = text or ""
    # visible text URLs — with scheme
    for m in re.finditer(r"https?://[^\s)\"'<>]+", t):
        u = m.group(0).rstrip(".,;)")
        links.append({"url": u, "normalized_url": normalize_url(u), "platform": classify_platform(u),
                      "link_type": "profile", "source": "visible_text", "page_number": 1, "anchor_text": "",
                      "verification_status": "pending", "confidence_score": 0.85})
    # visible text URLs — bare domain (no http/https scheme), e.g. "linkedin.com/in/name" or "github.com/user"
    domain_pat = "|".join(re.escape(d) for d in PLATFORM_DOMAINS)
    for m in re.finditer(rf"(?<![\w@./])(?<!://)(?:www\.)?({domain_pat})(/[^\s)\"'<>,]*)?", t, re.I):
        full = m.group(0)
        u = normalize_url(full)
        links.append({"url": u, "normalized_url": u, "platform": classify_platform(u),
                      "link_type": "profile", "source": "visible_text", "page_number": 1, "anchor_text": full,
                      "verification_status": "pending", "confidence_score": 0.75})
    # email / phone links
    for m in re.finditer(r"[\w\.-]+@[\w\.-]+\.\w+", t):
        raw = f"mailto:{m.group(0)}"
        links.append({"url": raw, "normalized_url": normalize_url(raw), "platform": "email",
                      "link_type": "social", "source": "visible_text", "page_number": 1, "anchor_text": m.group(0),
                      "verification_status": "pending", "confidence_score": 0.95})
    # embedded PDF annotations
    if ext == "pdf":
        try:
            from PyPDF2 import PdfReader
            import io
            r = PdfReader(io.BytesIO(data))
            for i, p in enumerate(r.pages):
                for a in (p.get("/Annots") or []):
                    try:
                        o = a.get_object()
                        uri = ((o.get("/A") or {}).get("/URI")) if "/A" in o else o.get("/URI")
                        if uri:
                            u = str(uri)
                            links.append({"url": u, "normalized_url": normalize_url(u), "platform": classify_platform(u),
                                          "link_type": "profile", "source": "embedded", "page_number": i + 1,
                                          "anchor_text": str(o.get("/Contents", "") or ""), "verification_status": "pending", "confidence_score": 0.95})
                    except Exception:
                        continue
        except Exception:
            pass
    # dedup by normalized
    seen, out = set(), []
    for l in links:
        if l["normalized_url"] not in seen:
            seen.add(l["normalized_url"])
            out.append(l)
    return out

# ---------- 2.4 page images (real render via PyMuPDF; falls back to a manifest-only stub) ----------
PAGES_DIR = os.path.join("uploads", "pages")

def page_images_manifest(resume_id: str, page_count: int) -> list:
    """Fallback manifest used when rendering isn't possible (e.g. DOCX, or PyMuPDF missing)."""
    return [{"page_number": i + 1, "image_path": f"/pages/{resume_id}_page_{i+1}.png",
             "width": 2480, "height": 3508, "dpi": 250, "format": "png"} for i in range(max(1, page_count))]

def render_page_images(data: bytes, ext: str, resume_id: str, dpi: int = 150) -> list:
    """Render each PDF page to an actual PNG on disk under PAGES_DIR. Returns a manifest with real paths.
    Returns [] if rendering isn't available (non-PDF, or PyMuPDF not installed) — caller should fall back."""
    if ext != "pdf":
        return []
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return []
    os.makedirs(PAGES_DIR, exist_ok=True)
    out = []
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=mat)
            fname = f"{resume_id}_page_{i+1}.png"
            abs_path = os.path.join(PAGES_DIR, fname)
            pix.save(abs_path)
            out.append({"page_number": i + 1, "image_path": f"/pages/{fname}", "abs_path": abs_path,
                        "width": pix.width, "height": pix.height, "dpi": dpi, "format": "png"})
        doc.close()
    except Exception:
        return []
    return out

def image_b64_for_vlm(abs_path: str, max_b64_bytes: int = 170_000) -> str:
    """Load a rendered page PNG and return base64, downscaling/re-encoding as JPEG if needed
    to stay under the inline-image size most hosted VLM endpoints (e.g. NVIDIA NIM) enforce."""
    try:
        from PIL import Image
    except ImportError:
        with open(abs_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    img = Image.open(abs_path).convert("RGB")
    quality = 85
    scale = 1.0
    while True:
        w, h = img.size
        resized = img.resize((max(1, int(w * scale)), max(1, int(h * scale)))) if scale < 1.0 else img
        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=quality)
        b64 = base64.b64encode(buf.getvalue()).decode()
        if len(b64) <= max_b64_bytes or (quality <= 40 and scale <= 0.4):
            return b64
        if quality > 40:
            quality -= 15
        else:
            scale *= 0.75

# ---------- 2.5 native text layer ----------
def native_text(data: bytes, ext: str) -> dict:
    out = {"native_pdf_text": "", "docx_text": "", "table_text": "", "header_text": "", "footer_text": "",
           "hyperlink_text": "", "extraction_error": ""}
    try:
        if ext == "pdf":
            from PyPDF2 import PdfReader
            import io
            r = PdfReader(io.BytesIO(data))
            t = ""
            for p in r.pages:
                t += (p.extract_text() or "") + "\n"
            out["native_pdf_text"] = t
        elif ext == "docx":
            import docx, io
            d = docx.Document(io.BytesIO(data))
            out["docx_text"] = "\n".join(p.text for p in d.paragraphs)
            out["table_text"] = "\n".join(c.text for t in d.tables for row in t.rows for c in row.cells)
    except Exception as e:
        out["extraction_error"] = f"native text extraction failed ({e}); falling back to raw byte decode"
        out["native_pdf_text"] = data[:20000].decode(errors="ignore")
    if not out["native_pdf_text"] and not out["docx_text"]:
        out["native_pdf_text"] = data[:20000].decode(errors="ignore")
    return out

# ---------- 2.6 VLM-style section parse (layout-aware heuristic; LLM hook when key set) ----------
SECTION_HEADS = ["education", "experience", "project", "skill", "certification", "achievement",
                 "publication", "internship", "volunteer", "leadership", "language", "course", "hackathon", "reference", "summary", "objective"]

def vlm_parse(text: str) -> dict:
    t = text or ""
    lines = [l.strip() for l in t.splitlines() if l.strip()]
    email = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", t)
    phone = re.search(r"(\+?\d[\d\s\-]{7,}\d)", t)
    # name = first non-email line
    name = next((l for l in lines[:5] if "@" not in l and len(l) < 60), "Candidate")
    # skills block
    skills = []
    for kw in ["React", "JavaScript", "TypeScript", "Python", "FastAPI", "Django", "Node.js", "PostgreSQL",
               "MongoDB", "MySQL", "Docker", "Kubernetes", "AWS", "TensorFlow", "PyTorch", "Scikit-learn",
               "Pandas", "SQL", "GraphQL", "Figma", "Java", "C++", "Go", "Redis", "Communication", "Leadership", "Teamwork"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", t, re.I) and kw not in skills:
            skills.append(kw)
    # projects: split on project-ish headings
    projects = []
    for m in re.finditer(r"(?im)^(?:project\d*|[\w\s\-]{3,50}(?:app|system|platform|analyzer|dashboard|website|model|api))\s*[:\-]?\s*(.+)?$", t):
        title = m.group(0).strip()[:80]
        if len(projects) < 6 and len(title) > 4:
            projects.append({"project_title": title, "description": (m.group(1) or "")[:400],
                             "tech_stack": [s for s in skills if s.lower() in t.lower()][:5]})
    if not projects and t.strip():
        projects = [{"project_title": "Resume Project", "description": t[:500], "tech_stack": skills[:5]}]
    # bullets — some PDF text layers (e.g. WeasyPrint-produced) put the bullet glyph on its own
    # line separate from the following text; merge those instead of collecting bare markers.
    bullets = []
    i = 0
    while i < len(lines) and len(bullets) < 20:
        l = lines[i]
        if l in ("•", "-", "*", "–") and i + 1 < len(lines):
            bullets.append(lines[i + 1])
            i += 2
            continue
        if l.startswith(("•", "-", "*", "–")) and len(l) > 2:
            bullets.append(l.lstrip("•-*– ").strip())
        i += 1
    return {"full_name": name, "email": email.group(0) if email else "", "phone": phone.group(0) if phone else "",
            "skills_raw": skills, "projects_raw": projects, "bullets": bullets,
            "sections_found": [s for s in SECTION_HEADS if s in t.lower()]}

# ---------- 2.6b real VLM extraction (NVIDIA/OpenAI/OpenRouter vision model) ----------
# Two-stage approach: the vision model is good at *reading* the page but, being a smaller
# instruct model, does not reliably follow "output strict JSON" — it answers in prose even
# when told not to (confirmed: NVIDIA's endpoint also ignores response_format=json_object for
# this model). So stage 1 asks it to describe the page thoroughly in plain text, and stage 2
# hands that description to a text LLM (Groq) purely to restructure it into the JSON schema —
# text models follow strict formatting instructions far more reliably than small VLMs do.
VLM_DESCRIBE_PROMPT = """Read this resume page image carefully and transcribe/describe everything on it in
plain text: full name, contact info (email, phone, location), headline/summary, education entries
(institution, degree, field of study, dates, GPA), work experience and internships (company, role,
dates, description, achievements), projects (title, description, tech stack, any GitHub/demo links),
skills, certifications, achievements, and languages. Only include what is actually visible on this
page — do not guess or invent anything. Be thorough and literal."""

VLM_JSON_SCHEMA_PROMPT = """Convert the following resume-page description into ONE JSON object with
EXACTLY these keys (use "" or [] for anything not mentioned in the description — never invent data):

{{
  "full_name": "", "email": "", "phone": "", "location": "", "headline": "", "summary": "",
  "education": [{{"institution_name": "", "degree": "", "field_of_study": "", "start_date": "", "end_date": "", "gpa": ""}}],
  "work_experience": [{{"company_name": "", "role_title": "", "start_date": "", "end_date": "", "description": "", "achievements": []}}],
  "internships": [{{"company_name": "", "role_title": "", "start_date": "", "end_date": "", "description": ""}}],
  "projects": [{{"project_title": "", "description": "", "tech_stack": [], "github_link": "", "demo_link": ""}}],
  "skills": [],
  "certifications": [{{"name": "", "issuer": "", "date": ""}}],
  "achievements": [],
  "languages": []
}}

Respond with ONLY the JSON object — no markdown fences, no commentary.

DESCRIPTION:
{description}"""

def parse_json_loose(raw: str):
    if not raw:
        return None
    s = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.I | re.M).strip()
    start, end = s.find("{"), s.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = s[start:end + 1]
    for attempt in (candidate, re.sub(r",\s*([}\]])", r"\1", candidate)):
        try:
            return json.loads(attempt)
        except Exception:
            continue
    return None

def _dedupe_dicts(items: list, key_field: str) -> list:
    seen, out = set(), []
    for x in items:
        if not isinstance(x, dict):
            continue
        k = str(x.get(key_field, "")).strip().lower()[:60]
        if not k or k not in seen:
            seen.add(k)
            out.append(x)
    return out

async def vlm_extract_profile(pages: list):
    """Call the configured VLM once per rendered page image and merge the results into one raw
    profile dict. `pages` is render_page_images() output (each item needs an 'abs_path').
    Returns None if the VLM isn't configured or every page call/parse fails — caller falls back
    to the regex-based vlm_parse() over the native text layer."""
    if not AI.vlm_configured() or not pages:
        return None
    merged = {"full_name": "", "email": "", "phone": "", "location": "", "headline": "", "summary": "",
              "education": [], "work_experience": [], "internships": [], "projects": [],
              "skills": [], "certifications": [], "achievements": [], "languages": [], "page_errors": []}
    any_ok = False
    for p in pages[:6]:
        try:
            b64 = image_b64_for_vlm(p["abs_path"])
            description = await AI.vlm_chat(b64, VLM_DESCRIBE_PROMPT)
        except Exception as e:
            merged["page_errors"].append(f"page {p['page_number']}: VLM call failed ({e})")
            continue
        if not (description or "").strip():
            merged["page_errors"].append(f"page {p['page_number']}: VLM returned empty description")
            continue
        try:
            raw = await AI.chat([{"role": "user", "content": VLM_JSON_SCHEMA_PROMPT.format(description=description)}],
                                max_tokens=4096)
            data = parse_json_loose(raw)
        except Exception as e:
            merged["page_errors"].append(f"page {p['page_number']}: JSON structuring call failed ({e})")
            continue
        if not data:
            merged["page_errors"].append(f"page {p['page_number']}: could not parse structured JSON output")
            continue
        any_ok = True
        for k, limit in (("full_name", 150), ("email", 150), ("phone", 60), ("location", 150),
                        ("headline", 2000), ("summary", 2000)):
            if not merged[k] and data.get(k):
                merged[k] = str(data[k])[:limit]
        for k in ("education", "work_experience", "internships", "projects", "certifications"):
            merged[k].extend(x for x in (data.get(k) or []) if isinstance(x, dict))
        for k in ("skills", "achievements", "languages"):
            merged[k].extend(str(x) for x in (data.get(k) or []) if isinstance(x, (str, int, float)))
    if not any_ok:
        return None
    merged["education"] = _dedupe_dicts(merged["education"], "institution_name")
    merged["work_experience"] = _dedupe_dicts(merged["work_experience"], "company_name")
    merged["internships"] = _dedupe_dicts(merged["internships"], "company_name")
    merged["projects"] = _dedupe_dicts(merged["projects"], "project_title")
    merged["certifications"] = _dedupe_dicts(merged["certifications"], "name")
    merged["skills"] = sorted({s.strip() for s in merged["skills"] if s.strip()}, key=str.lower)
    merged["achievements"] = list(dict.fromkeys(a.strip() for a in merged["achievements"] if a.strip()))
    merged["languages"] = list(dict.fromkeys(l.strip() for l in merged["languages"] if l.strip()))
    merged["skills_raw"] = merged["skills"]
    merged["projects_raw"] = merged["projects"]
    return merged

# ---------- 2.7 normalize ----------
def normalize_skill(s: str) -> str:
    return CANON.get(s.strip().lower(), s.strip())

def valid_email(e: str) -> bool:
    return bool(re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", e or ""))

def valid_phone(p: str) -> bool:
    d = re.sub(r"\D", "", p or "")
    return 7 <= len(d) <= 15

def normalize_profile(raw: dict, links: list, resume_id: str, filename: str) -> tuple:
    tech = sorted({normalize_skill(s) for s in raw.get("skills_raw", []) if s.lower() in TECH_SKILLS or s.lower() not in SOFT_SKILLS})
    soft = sorted({normalize_skill(s) for s in raw.get("skills_raw", []) if s.lower() in SOFT_SKILLS})
    email, phone = raw.get("email", ""), raw.get("phone", "")
    if not valid_email(email):
        email_conf = 0.3
    else:
        email_conf = 0.95
    phone_conf = 0.9 if valid_phone(phone) else 0.3
    profile_links, coding, social, design, prof = [], [], [], [], []
    for l in links:
        p = l["platform"]
        entry = {"url": l["url"], "normalized_url": l["normalized_url"], "platform": p,
                 "link_type": "profile", "source": l["source"], "page_number": l["page_number"],
                 "anchor_text": l.get("anchor_text", ""), "verification_status": "pending", "confidence_score": l.get("confidence_score", 0.8)}
        profile_links.append(entry)
        if p in ("github", "gitlab", "bitbucket", "leetcode", "hackerrank", "hackerearth", "codeforces", "codechef", "kaggle", "stackoverflow"):
            coding.append(entry)
        elif p in ("behance", "dribbble", "figma"):
            design.append(entry)
        elif p in ("linkedin", "medium", "dev_to", "researchgate", "orcid"):
            prof.append(entry)
        else:
            social.append(entry)
    profile = {
        "resume_id": resume_id,
        "file_metadata": {"filename": filename},
        "personal_information": {"full_name": raw.get("full_name", ""), "first_name": raw.get("full_name", "").split(" ")[0],
                                 "last_name": " ".join(raw.get("full_name", "").split(" ")[1:]), "email": email, "phone": phone,
                                 "alternate_phone": "", "location": raw.get("location", ""), "city": "", "state": "", "country": "",
                                 "postal_code": "", "nationality": "", "date_of_birth": "", "gender": "",
                                 "profile_photo_present": False, "headline": raw.get("headline", ""), "current_role": "", "target_role": "Full Stack Developer"},
        "career_objective": {}, "professional_summary": {"summary": raw.get("summary", "")},
        "education": [{"institution_name": e.get("institution_name", ""), "degree": e.get("degree", ""),
                       "field_of_study": e.get("field_of_study", ""), "start_date": e.get("start_date", ""),
                       "end_date": e.get("end_date", ""), "gpa": e.get("gpa", "")} for e in raw.get("education", [])],
        "work_experience": [{"company_name": w.get("company_name", ""), "role_title": w.get("role_title", ""),
                             "start_date": w.get("start_date", ""), "end_date": w.get("end_date", ""),
                             "description": w.get("description", ""),
                             "achievements": [str(a) for a in (w.get("achievements") or [])]} for w in raw.get("work_experience", [])],
        "internships": [{"company_name": i.get("company_name", ""), "role_title": i.get("role_title", ""),
                         "start_date": i.get("start_date", ""), "end_date": i.get("end_date", ""),
                         "description": i.get("description", "")} for i in raw.get("internships", [])],
        "projects": [{"problem_statement": "", "solution": "", "role": "", "team_size": "", "start_date": "",
                      "end_date": "", "tools_used": [], "features": [], "impact": "", "metrics": [],
                      "documentation_link": "", "deployment_status": "unknown", "complexity_level": "", "verified": False,
                      **p,
                      "github_link": p.get("github_link") or next((l["url"] for l in profile_links if l["platform"] == "github"), ""),
                      "demo_link": p.get("demo_link", "")} for p in raw.get("projects_raw", [])],
        "skills": {"technical_skills": tech, "programming_languages": [s for s in tech if s in ("Python", "JavaScript", "TypeScript", "Java", "C++", "Go")],
                   "frameworks": [s for s in tech if s in ("React", "FastAPI", "Django", "Node.js")],
                   "libraries": [], "databases": [s for s in tech if s in ("PostgreSQL", "MongoDB", "MySQL", "Redis")],
                   "cloud_platforms": [s for s in tech if s in ("AWS", "Azure")], "devops_tools": [s for s in tech if s in ("Docker", "Kubernetes")],
                   "ai_ml_skills": [s for s in tech if s in ("TensorFlow", "PyTorch", "Scikit-learn", "Pandas")],
                   "data_skills": [], "design_tools": [s for s in tech if s == "Figma"], "business_tools": [],
                   "marketing_tools": [], "finance_tools": [], "healthcare_tools": [], "research_tools": [],
                   "soft_skills": soft, "domain_skills": [], "other_skills": []},
        "certifications": [{"name": c.get("name", ""), "issuer": c.get("issuer", ""), "date": c.get("date", "")}
                           for c in raw.get("certifications", [])],
        "achievements": list(raw.get("achievements", [])), "publications": [], "research_experience": [],
        "volunteering": [], "leadership": [], "extracurriculars": [], "languages": list(raw.get("languages", [])),
        "portfolio_links": profile_links, "social_links": social, "coding_profiles": coding,
        "design_profiles": design, "professional_profiles": prof,
        "licenses": [], "awards": [], "patents": [], "courses": [], "workshops": [],
        "hackathons": [], "competitions": [], "references": [], "custom_sections": [],
        "extraction_confidence": {"email": email_conf, "phone": phone_conf,
                                  "skills": 0.8 if tech else 0.4, "projects": 0.75 if raw.get("projects_raw") else 0.4},
        "missing_fields": [f for f, ok in [("email", bool(email)), ("phone", valid_phone(phone)),
                                           ("education", bool(raw.get("education"))),
                                           ("project_links", any("github" in l.get("url", "") for l in profile_links))] if not ok],
        "warnings": ([] if valid_email(email) else ["Invalid or missing email"]) + raw.get("page_errors", []),
    }
    conf = profile["extraction_confidence"]
    return profile, conf
