"""Phase state machine — docs v2 §6-7. Seven resume-grounded phases with exchange budgets."""
PHASES = ["introduction", "resume_walkthrough", "project_deep_dive",
          "technical", "critical_thinking", "behavioral", "closing"]
LIMITS = {"introduction": 2, "resume_walkthrough": 3, "project_deep_dive": 5,
          "technical": 6, "critical_thinking": 4, "behavioral": 3, "closing": 2}
LABELS = {"introduction": "Introduction", "resume_walkthrough": "Resume Walkthrough",
          "project_deep_dive": "Project Deep Dive", "technical": "Technical Skills",
          "critical_thinking": "Critical Thinking", "behavioral": "Behavioral",
          "closing": "Closing"}

def next_phase(current: str) -> str | None:
    i = PHASES.index(current)
    return PHASES[i + 1] if i + 1 < len(PHASES) else None

def register_exchange(current_phase: str, phase_counts: dict) -> tuple[str, bool]:
    """One completed Q→A exchange. phase_counts already includes it (built from
    the stored transcript). Returns (phase_after, interview_ended)."""
    if phase_counts.get(current_phase, 0) >= LIMITS[current_phase]:
        nxt = next_phase(current_phase)
        if nxt is None:
            return current_phase, True
        return nxt, False
    return current_phase, False
