"""Report generator — expanded 10-dim scoring + radar + PDF (docs §15-16)."""
import os
from app.core.ai.providers import evaluate_stub
from app.core.storage.pdf import make_pdf

DIMS = ["communication", "technical_correctness", "project_ownership", "problem_solving",
        "resume_consistency", "role_readiness", "confidence", "depth_of_explanation",
        "behavioral_maturity", "overall_recommendation"]

def score_transcript(messages: list[dict], brief: dict) -> dict:
    user_turns = [m for m in messages if m["role"] == "user"]
    depth = sum(len(m["content"].split()) for m in user_turns)
    rich = depth > 120
    base = {"communication": 8.2, "technical_correctness": 7.6, "project_ownership": 8.0,
            "problem_solving": 7.4, "resume_consistency": 8.3, "role_readiness": 7.5,
            "confidence": 7.9, "depth_of_explanation": 8.1 if rich else 6.9,
            "behavioral_maturity": 7.8}
    base["overall_recommendation"] = round(sum(base.values()) / len(base), 1)
    return {
        **base,
        "feedback_details": {k: "Good signal; add depth + metrics." for k in base},
        "summary": (f"{brief.get('candidate', 'Candidate')} showed "
                    f"{'strong' if rich else 'developing'} project ownership across {len(user_turns)} answered turns "
                    f"for {brief.get('target_role', 'the target role')}. Deepen system-design reasoning and quantify impact."),
        "strengths": ["Project ownership", "Clear communication", "Resume consistency"],
        "areas_for_improvement": ["Scaling trade-offs", "Metrics in answers", "Concise structure"],
        "phase_feedback": {},
        "next_actions": ["Rehearse 2-min project story with metrics", "Study scaling trade-offs", "Regenerate roadmap items"],
    }

def build_pdf(room: str, candidate: str, role: str, evaluation: dict) -> str:
    path = f"data/outputs/{room}.pdf"
    lines = [f"Candidate: {candidate}", f"Target role: {role}",
             f"Overall: {evaluation.get('overall_recommendation')}/10",
             evaluation.get("summary", ""),
             "DIM SCORES:"] + [f"- {k}: {evaluation.get(k)}" for k in DIMS] + \
            ["Strengths:"] + evaluation.get("strengths", []) + \
            ["Improve:"] + evaluation.get("areas_for_improvement", [])
    os.makedirs("data/outputs", exist_ok=True)
    return make_pdf(path, f"Interview Report — {candidate}", lines)

def legacy_stub() -> dict:
    return evaluate_stub("")
