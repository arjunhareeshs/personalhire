ROLE_TRACKS = {
  "frontend": ["HTML/CSS", "JavaScript", "React", "Testing", "Deployment"],
  "backend": ["API design", "Databases", "Auth", "Caching", "DevOps"],
  "full stack": ["Frontend basics", "Backend APIs", "Databases", "Projects", "Interview prep"],
}
def generate(profile: dict, target_role: str) -> dict:
    skills = (profile.get("skills") or {}).get("technical_skills", []) or []
    key = "full stack" if "full" in target_role.lower() else ("frontend" if "front" in target_role.lower() else "backend")
    tracks = ROLE_TRACKS.get(key, ROLE_TRACKS["full stack"])
    months = []
    titles = ["Foundations", "Core skills", "Practice", "Projects", "Advanced + certs", "Polish + interviews"]
    for i, t in enumerate(titles, 1):
        months.append({"month": i, "title": t, "goal": f"{t} for {target_role}",
            "weeks": [{"week": w, "focus": tracks[min(w - 1, len(tracks) - 1)], "tasks": [f"Learn {tracks[0]}", "Practice set", "Mini deliverable"], "resources": ["Docs", "Course"], "practice": ["Exercise"], "deliverables": ["Checkpoint"]} for w in range(1, 5)],
            "skills_covered": tracks, "project_work": [f"Month {i} project"], "certification_recommendations": ["AWS Cloud Practitioner"] if i >= 5 else []})
    return {"resume_id": profile.get("resume_id", ""), "target_role": target_role, "duration_months": 6,
            "current_level": "fresher" if len(skills) < 4 else "junior",
            "roadmap_summary": f"6-month {target_role} plan from {len(skills)} current skills.",
            "months": months, "skill_dependencies": tracks, "certifications": ["AWS Cloud Practitioner"], "progress": {}}
