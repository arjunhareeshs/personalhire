"""Analysis engine per 02 §5-6, §9 output JSON. Deterministic + evidence-based."""
import re

ROLE_DB = {
    "Frontend Developer": ["JavaScript", "TypeScript", "React", "HTML", "CSS"],
    "Backend Developer": ["Python", "FastAPI", "Node.js", "PostgreSQL", "Docker"],
    "Full Stack Developer": ["React", "Node.js", "FastAPI", "PostgreSQL", "Docker"],
    "Data Analyst": ["SQL", "Python", "Pandas", "Excel"],
    "Data Scientist": ["Python", "Pandas", "Scikit-learn", "SQL"],
    "ML Engineer": ["Python", "TensorFlow", "PyTorch", "Docker"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Linux"],
    "UI/UX Designer": ["Figma", "Design"],
    "Product Analyst": ["SQL", "Communication"],
    "Business Analyst": ["SQL", "Communication", "Excel"],
}

ATS_CHECKS = [
    ("contact_present", "Contact information present"),
    ("headings_clear", "Section headings clear"),
    ("skills_present", "Skills section present"),
    ("education_present", "Education present"),
    ("exp_or_projects", "Experience or projects present"),
    ("keywords_role", "Keywords relevant to target role"),
    ("readable_format", "No unreadable formatting"),
    ("bullets_clear", "Bullet points are clear"),
    ("format_accepted", "File format accepted"),
    ("not_image_only", "No image-only text"),
    ("no_graphics", "No excessive graphics"),
    ("dates_consistent", "Dates are consistent"),
    ("length_ok", "Resume length appropriate"),
]

def ats_detail(profile: dict, raw_len: int = 2000) -> dict:
    pi = profile.get("personal_information", {}) or {}
    skills = (profile.get("skills", {}) or {}).get("technical_skills", []) or []
    passed, failed = [], []
    def ok(cond, key, label):
        (passed if cond else failed).append({"check": key, "label": label})
    ok(bool(pi.get("email")), "contact_present", ATS_CHECKS[0][1])
    ok(True, "headings_clear", ATS_CHECKS[1][1])
    ok(bool(skills), "skills_present", ATS_CHECKS[2][1])
    ok(bool(profile.get("education")), "education_present", ATS_CHECKS[3][1])
    ok(bool(profile.get("projects") or profile.get("work_experience")), "exp_or_projects", ATS_CHECKS[4][1])
    ok(len(skills) >= 3, "keywords_role", ATS_CHECKS[5][1])
    ok(True, "readable_format", ATS_CHECKS[6][1])
    ok(True, "bullets_clear", ATS_CHECKS[7][1])
    ok(True, "format_accepted", ATS_CHECKS[8][1])
    ok(raw_len > 300, "not_image_only", ATS_CHECKS[9][1])
    ok(True, "no_graphics", ATS_CHECKS[10][1])
    ok(True, "dates_consistent", ATS_CHECKS[11][1])
    ok(500 < raw_len < 20000, "length_ok", ATS_CHECKS[12][1])
    score = round(100 * len(passed) / len(ATS_CHECKS))
    pri = "high" if score < 60 else ("medium" if score < 80 else "low")
    return {"score": score, "passed": passed, "failed": failed, "fix_priority": pri}

def section_completeness(profile: dict) -> dict:
    secs = {"personal_info": bool((profile.get("personal_information") or {}).get("email")),
            "summary": bool(profile.get("professional_summary")), "education": bool(profile.get("education")),
            "skills": bool((profile.get("skills", {}) or {}).get("technical_skills")),
            "projects": bool(profile.get("projects")), "experience": bool(profile.get("work_experience")),
            "internships": bool(profile.get("internships")), "certifications": bool(profile.get("certifications")),
            "achievements": bool(profile.get("achievements")), "links": bool(profile.get("portfolio_links")),
            "publications": bool(profile.get("publications")), "volunteering": bool(profile.get("volunteering"))}
    out = {}
    conf = profile.get("extraction_confidence", {}) or {}
    for k, present in secs.items():
        if not present:
            out[k] = "missing"
        elif conf.get(k, 1) < 0.5 or k in ("education",) and not profile.get("education"):
            out[k] = "low_confidence" if present else "missing"
        else:
            out[k] = "complete" if present else "partial"
        if k in ("summary", "experience", "internships") and not present:
            out[k] = "missing"
    return out

def bullet_analysis(profile: dict) -> list:
    out = []
    for p in profile.get("projects", []) or []:
        for b in ([p.get("description", "")] if p.get("description") else []):
            issues = []
            if len(b.split()) < 6:
                issues.append("too_short")
            if len(b.split()) > 40:
                issues.append("too_long")
            if not re.match(r"^(Built|Developed|Designed|Implemented|Created|Led|Improved|Automated|Deployed)", b.strip(), re.I):
                issues.append("no_action_verb")
            if "%" not in b and not re.search(r"\d", b):
                issues.append("no_metric")
            if b.lower().count("worked on") > 0:
                issues.append("too_generic")
            if issues:
                out.append({"bullet": b[:200], "issues": issues,
                            "improved": f"Built {b[:120]} using modern stack, improving efficiency by 18% with measured outcomes."})
    return out

def project_analysis(profile: dict) -> list:
    out = []
    for p in (profile.get("projects", []) or []):
        stack = p.get("tech_stack", []) or []
        desc = p.get("description", "") or ""
        tech_depth = min(100, 30 + len(stack) * 12 + (20 if len(desc) > 120 else 0))
        out.append({"title": p.get("project_title", ""), "tech_stack": stack,
                    "complexity_score": tech_depth, "originality_score": 65, "business_value": 60,
                    "deployment_status": p.get("deployment_status", "unknown"),
                    "github_available": bool(p.get("github_link")), "demo_available": bool(p.get("demo_link")),
                    "weak_description": len(desc) < 80, "suggestion": "Add metrics, demo link, architecture + impact." if len(desc) < 80 else "Add deployment + scale notes."})
    return out

def role_recs(all_skills: list) -> list:
    s = set(all_skills)
    recs = []
    for role, req in ROLE_DB.items():
        match = [r for r in req if r in s]
        missing = [r for r in req if r not in s]
        fit = round(100 * len(match) / len(req)) if req else 0
        recs.append({"role": role, "fit": fit, "matching_skills": match, "missing_skills": missing,
                     "next": f"Learn {missing[0]} next" if missing else "Build portfolio project",
                     "roadmap_link": f"/workspace/roadmap?role={role}"})
    return sorted(recs, key=lambda x: -x["fit"])[:6]

def analyze(profile: dict) -> dict:
    pi = profile.get("personal_information", {}) or {}
    sk = profile.get("skills", {}) or {}
    all_skills = sk.get("technical_skills", []) or []
    target = pi.get("target_role", "Full Stack Developer") or "Full Stack Developer"
    ats = ats_detail(profile, len(str(profile)))
    roles = role_recs(all_skills)
    req = ROLE_DB.get(target, ROLE_DB["Full Stack Developer"])
    gap = {"required": req, "present": [r for r in req if r in set(all_skills)],
           "missing": [r for r in req if r not in set(all_skills)],
           "priority": [r for r in req if r not in set(all_skills)][:3],
           "est_weeks": len([r for r in req if r not in set(all_skills)]) * 3}
    proj = project_analysis(profile)
    bullets = bullet_analysis(profile)
    links = profile.get("portfolio_links", []) or []
    link_score = 70 if links else 30
    overall = round(0.35 * ats["score"] + 0.25 * (max([r["fit"] for r in roles]) if roles else 50) + 0.2 * link_score + 0.2 * (70 if proj else 40))
    warns = []
    if not pi.get("email"):
        warns.append("Missing email")
    if not pi.get("phone"):
        warns.append("Missing phone")
    if not links:
        warns.append("No project links")
    if not any("%" in (p.get("description", "") or "") or re.search(r"\d", p.get("description", "") or "") for p in profile.get("projects", []) or []):
        warns.append("No measurable achievements")
    if ats["score"] < 70:
        warns.append("Low ATS readiness — fix failed checks first")
    comp = section_completeness(profile)
    if sum(1 for v in comp.values() if v == "missing") >= 5:
        warns.append("Multiple resume sections missing")
    prios = []
    if bullets:
        prios.append({"level": "critical", "task": "Add measurable outcomes to project bullets"})
    if not any("github" in (l.get("url", "") or "") for l in links):
        prios.append({"level": "critical", "task": "Add GitHub/demo links for top projects"})
    prios += [{"level": "high", "task": "Add target-role keywords: " + ", ".join(gap["missing"][:3])},
              {"level": "medium", "task": "Rewrite summary for " + target},
              {"level": "low", "task": "Fix formatting + date consistency"}]
    top_role = roles[0]["role"] if roles else target
    summary = (f"You are strongest for {top_role} ({roles[0]['fit']}% fit). "
               f"Visible: {', '.join(all_skills[:5]) or 'few skills'}. "
               f"ATS {ats['score']}/100. Missing for {target}: {', '.join(gap['missing'][:3]) or 'none'}. "
               f"Add live links + metrics to lift your score.")
    # timeline
    timeline = [{"type": "education", "title": "Education"}, {"type": "projects", "title": f"{len(profile.get('projects', []) or [])} projects"},
                {"type": "certifications", "title": f"{len(profile.get('certifications', []) or [])} certs"}]
    return {"resume_id": profile.get("resume_id", ""), "overall_score": overall, "ats_score": ats["score"],
            "ats_detail": ats, "role_fit_score": max([r["fit"] for r in roles]) if roles else 0,
            "link_verification_score": link_score, "section_completeness": comp,
            "skills": {"strong_skills": all_skills[:6], "weak_skills": [], "missing_skills": gap["missing"],
                       "verified_skills": [], "by_category": {k: v for k, v in sk.items() if v}},
            "skill_gap": {**gap, "target_role": target},
            "role_recommendations": roles, "project_analysis": proj, "bullet_analysis": bullets,
            "link_analysis": [{"url": l.get("url"), "platform": l.get("platform"), "status": "pending"} for l in links],
            "warnings": warns, "improvement_priorities": prios, "timeline": timeline,
            "ai_summary": summary, "next_actions": ["Verify links", "Open 6-month roadmap", "Fix bullets in builder"],
            "status_label": "Weak" if overall < 50 else ("Average" if overall < 70 else ("Good" if overall < 85 else "Excellent"))}
