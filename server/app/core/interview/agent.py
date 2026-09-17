"""Interviewer agent — one short resume-grounded question per turn (docs §4, §19)."""
import os
from app.core.interview import resume_service as RS
from app.core.interview import llm_service as LLM

PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts", "interview.md")

def system_prompt(brief: dict) -> str:
    base = open(PROMPT_PATH).read() if os.path.exists(PROMPT_PATH) else "You are an expert technical interviewer."
    return (f"{base}\n\n## Resume brief (NEVER invent beyond this):\n{RS.brief_text(brief)}\n"
            f"\nRules: one question per turn, ≤30s spoken, encouraging, resume-grounded.")

async def opening(brief: dict) -> str:
    q = await LLM.ask(system_prompt(brief),
                      "Write ONLY the opening line: welcome, confirm you've reviewed the resume, ask for a brief intro + target role. One short paragraph.")
    return q or LLM.fallback_question("introduction", brief)

async def next_question(brief: dict, phase: str, recent: list[dict], rag: list[str] | None = None) -> str:
    convo = "\n".join(f"{m['role']}: {m['content'][:300]}" for m in recent[-8:])
    extra = f"\nRetrieved resume evidence:\n" + "\n".join(f"- {c[:200]}" for c in (rag or [])[:3]) if rag else ""
    q = await LLM.ask(system_prompt(brief),
                      f"Current phase: {phase}.\n{extra}\nRecent transcript:\n{convo}\nWrite ONLY the next interviewer question (one question, short, resume-grounded, no answers).")
    return q or LLM.fallback_question(phase, brief)
