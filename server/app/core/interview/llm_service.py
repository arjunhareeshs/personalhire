"""LLM service — provider abstraction with resume-grounded fallback (docs §13.2)."""
from app.core.ai.providers import chat as provider_chat

async def ask(system: str, user: str) -> str:
    try:
        out = await provider_chat([{"role": "system", "content": system}, {"role": "user", "content": user}])
        if out and len(out.strip()) > 3:
            return out.strip()[:600]
    except Exception:
        pass
    return ""

def fallback_question(phase: str, brief: dict) -> str:
    sk = brief.get("skills", []) or ["your stack"]
    pr = (brief.get("projects", []) or [{}])[0]
    role = brief.get("target_role", "your target role")
    return {
        "introduction": f"Welcome — I've reviewed your resume. Briefly introduce yourself and tell me which project you're most confident discussing today?",
        "resume_walkthrough": f"Walk me through your resume — you list {', '.join(sk[:3])}. Which of these do you feel strongest in, and why?",
        "project_deep_dive": f"In '{pr.get('title', 'your main project')}', what problem were you solving and why did you choose {', '.join((pr.get('stack') or sk[:2]))}?",
        "technical": f"Your resume lists {sk[0]}. Can you explain a core concept in it as you would to a teammate?",
        "critical_thinking": f"If your {pr.get('title', 'project')} suddenly had 100x traffic, what would break first and how would you fix it?",
        "behavioral": "Tell me about a time you had to learn something quickly for a project. What did you do?",
        "closing": "Before we close — anything from your resume you'd like me to weigh in the report? Any questions for me?",
    }.get(phase, "Tell me more about that.")
