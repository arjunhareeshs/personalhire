"""Resume context service — builds the grounded brief + retrieval queries (docs §10)."""
def summarize(profile: dict | None) -> dict:
    p = profile or {}
    pi = p.get("personal_information", {}) or {}
    skills = ((p.get("skills", {}) or {}).get("technical_skills", []) or [])[:12]
    projects = [{"title": x.get("project_title", ""), "stack": x.get("tech_stack", []) or [],
                 "desc": (x.get("description", "") or "")[:300]} for x in (p.get("projects", []) or [])[:5]]
    return {"candidate": pi.get("full_name", "Candidate"),
            "target_role": pi.get("target_role", "Full Stack Developer"),
            "skills": skills,
            "projects": projects,
            "experience": [f"{x.get('role_title', '')} @ {x.get('company_name', '')}" for x in (p.get("work_experience", []) or [])[:4]],
            "certifications": [c.get("certification_name", "") for c in (p.get("certifications", []) or [])[:5]]}

def brief_text(s: dict) -> str:
    lines = [f"Candidate: {s['candidate']} — targeting {s['target_role']}.",
             f"Skills: {', '.join(s['skills']) or 'not listed'}.",
             "Projects:"]
    for pr in s["projects"]:
        lines.append(f"- {pr['title']} [{', '.join(pr['stack'])}]: {pr['desc']}")
    if s["experience"]:
        lines.append("Experience: " + "; ".join(s["experience"]))
    return "\n".join(lines)

QUERIES = ["candidate projects and technology stack", "candidate strongest skills",
           "candidate target role and missing skills", "candidate education and experience"]
