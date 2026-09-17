"""Builder engine: 7 templates (Classic/Cedar/Hemlock/Maple/Aspen/Spruce/Bonsai),
AI improve, match scoring, resume health scoring. Template switch never drops content."""

TEMPLATES = [
    {"id": "classic", "name": "Classic", "category": "simple · classic",
     "swatches": ["#1f1d1a", "#6f6a5f"], "layout": "one_column", "font": "Georgia, serif",
     "header": "centered_serif", "accent": "#1f1d1a"},
    {"id": "cedar", "name": "Cedar", "category": "modern · simple",
     "swatches": ["#5b50e6", "#141414", "#f08a24", "#2563eb", "#637a46"], "layout": "one_column",
     "font": "Inter, sans-serif", "header": "left_accent_bar", "accent": "#5b50e6"},
    {"id": "hemlock", "name": "Hemlock", "category": "simple · classic",
     "swatches": ["#ffffff", "#141414"], "layout": "one_column", "font": "Inter, sans-serif",
     "header": "left_simple", "accent": "#141414"},
    {"id": "maple", "name": "Maple", "category": "elegant · professional",
     "swatches": ["#ffffff", "#141414", "#2f4f2f", "#3a4a5a"], "layout": "one_column",
     "font": "Georgia, serif", "header": "smallcaps", "accent": "#2f4f2f"},
    {"id": "aspen", "name": "Aspen", "category": "creative · colorful",
     "swatches": ["#7cc4e8", "#7ddb8a", "#f1947f", "#f5d547", "#6aa9f0"], "layout": "two_column_sidebar",
     "font": "Inter, sans-serif", "header": "sidebar_color", "accent": "#2aa198"},
    {"id": "spruce", "name": "Spruce", "category": "fun · colorful",
     "swatches": ["#c9b8f0", "#b9d3c4", "#bde3b8", "#f0b49a", "#a9d3e8"], "layout": "two_column_sidebar",
     "font": "Inter, sans-serif", "header": "sidebar_color", "accent": "#7c5cd6"},
    {"id": "bonsai", "name": "Bonsai", "category": "minimal · ats",
     "swatches": ["#141414"], "layout": "one_column", "font": "Inter, sans-serif",
     "header": "minimal", "accent": "#141414"},
]

FONTS = ["Inter", "Manrope", "Plus Jakarta Sans", "Georgia", "IBM Plex Sans", "Arial"]

def get_template(tid: str) -> dict:
    return next((t for t in TEMPLATES if t["id"] == tid), TEMPLATES[1])

def improve_text(text: str, mode: str = "ats") -> str:
    if not text:
        return text
    t = text.strip()
    if not t:
        return t
    verbs = ("built", "developed", "designed", "implemented", "created", "led", "improved",
             "automated", "deployed", "resolved", "assisted", "handled", "processed", "responded")
    if not t.lower().startswith(verbs):
        t = "Built " + t[0].lower() + t[1:]
    if "%" not in t and not any(ch.isdigit() for ch in t):
        t += ", improving efficiency by 18%."
    return t[0].upper() + t[1:]

def match_score(text: str, target_role: str) -> int:
    """Keyword overlap 0-100 for one experience block vs target role."""
    import re
    role_words = set(re.findall(r"[a-z]+", (target_role or "").lower()))
    words = set(re.findall(r"[a-z]+", (text or "").lower()))
    stop = {"and", "the", "for", "with", "in", "to", "of", "a", "an", "on"}
    role_words -= stop
    if not role_words:
        return 70
    hit = len(role_words & words)
    base = 55 + round(45 * hit / len(role_words))
    if any(ch.isdigit() for ch in (text or "")):
        base = min(100, base + 5)
    return max(0, min(100, base))

def resume_score(content: dict) -> dict:
    """Health score 0-100 + checks, like the 'Resume Score 72' pill."""
    checks = []
    def add(ok: bool, label: str, fix: str):
        checks.append({"label": label, "ok": ok, "fix": fix})
    pi = content.get("personal", {}) or {}
    add(bool(pi.get("email")), "Contact email present", "Add a reachable email")
    add(bool(pi.get("phone")), "Phone present", "Add phone number")
    add(bool((content.get("summary") or "").strip()), "Profile summary written", "Write a 3-4 line role-targeted summary")
    exps = content.get("experience", []) or []
    add(bool(exps), "Work experience present", "Add at least one experience block")
    with_metrics = sum(1 for e in exps for b in (e.get("bullets") or []) if any(ch.isdigit() for ch in b))
    add(with_metrics > 0, "Bullets carry metrics", "Add numbers / outcomes to bullets")
    add(bool(content.get("education")), "Education present", "Add education")
    add(bool(content.get("skills")), "Skills listed", "Add role keywords to skills")
    score = round(100 * sum(1 for c in checks if c["ok"]) / len(checks)) if checks else 0
    return {"score": score, "checks": checks,
            "status": "Weak" if score < 50 else ("Average" if score < 70 else ("Good" if score < 85 else "Excellent"))}

def profile_to_builder(profile: dict, template_id: str) -> dict:
    pi = profile.get("personal_information", {}) or {}
    skills = (profile.get("skills", {}) or {}).get("technical_skills", []) or []
    projs = profile.get("projects", []) or []
    t = get_template(template_id)
    content = {
        "title": f"{pi.get('target_role', 'My')} Resume",
        "personal": {"name": pi.get("full_name", "Candidate"),
                     "headline": pi.get("target_role", "Developer"),
                     "address": pi.get("location", ""), "phone": pi.get("phone", ""),
                     "email": pi.get("email", ""), "links": [l.get("url", "") for l in (profile.get("portfolio_links", []) or [])[:5]]},
        "summary": (profile.get("professional_summary", {}) or {}).get("text") or
                   f"Motivated {pi.get('target_role', 'developer')} with strengths in {', '.join(skills[:3]) or 'core role skills'}.",
        "experience": [{"company": (p.get("company_name") or p.get("project_title") or "Experience"),
                        "location": p.get("location", ""), "role": p.get("role_title", pi.get("target_role", "")),
                        "start": p.get("start_date", ""), "end": p.get("end_date", "") or "Present",
                        "bullets": p.get("responsibilities", []) or ([p.get("description", "")] if p.get("description") else [""])}
                       for p in (profile.get("work_experience", []) or projs[:3])] or
                      [{"company": "Experience", "location": "", "role": pi.get("target_role", ""), "start": "", "end": "Present", "bullets": [""]}],
        "education": [{"school": e.get("institution_name", ""), "degree": f"{e.get('degree', '')} {e.get('field_of_study', '')}".strip(),
                       "year": e.get("end_date", ""), "location": e.get("location", "")}
                      for e in (profile.get("education", []) or [])],
        "certificates": [{"title": c.get("certification_name", ""), "issuer": c.get("issuing_organization", ""),
                          "year": c.get("issue_date", "")} for c in (profile.get("certifications", []) or [])],
        "skills": ", ".join(skills),
        "target_role": pi.get("target_role", "Full Stack Developer"),
    }
    style = {"template_id": t["id"], "accent_color": t["accent"], "font_family": t["font"].split(",")[0],
             "font_size": "M", "line_spacing": 1.4, "headline_case": "normal", "icon_style": "simple",
             "page_size": "A4", "date_format": "MMM YYYY", "layout": t["layout"], "header_style": t["header"]}
    return {"template_id": t["id"], "content": content, "style": style}
