import os, httpx, json

VLM_PROVIDER = os.getenv("VLM_PROVIDER", "").lower()
VLM_API_KEY = os.getenv("VLM_API_KEY", "")
VLM_MODEL = os.getenv("VLM_MODEL", "meta/llama-3.2-90b-vision-instruct")
VLM_BASE_URLS = {
    "nvidia": "https://integrate.api.nvidia.com/v1",
    "openai": "https://api.openai.com/v1",
    "openrouter": "https://openrouter.ai/api/v1",
}

def vlm_configured() -> bool:
    return bool(VLM_API_KEY)

async def vlm_chat(image_b64: str, prompt: str, max_tokens: int = 2048) -> str:
    """Send one page image + prompt to the configured vision-language model. Returns raw text (expected JSON).
    Uses the standard OpenAI-style structured `image_url` content block — confirmed working against
    NVIDIA's integrate.api.nvidia.com for meta/llama-3.2-*-vision-instruct (the older NIM-specific
    inline <img> tag format was tried first and does NOT work for this model: it makes the model
    describe the base64 string as text instead of decoding it as an image)."""
    if not VLM_API_KEY:
        raise RuntimeError("VLM_API_KEY not configured")
    base = VLM_BASE_URLS.get(VLM_PROVIDER, VLM_BASE_URLS["nvidia"])
    content = [
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
    ]
    async with httpx.AsyncClient(timeout=90) as c:
        r = await c.post(f"{base}/chat/completions",
                          headers={"Authorization": f"Bearer {VLM_API_KEY}"},
                          json={"model": VLM_MODEL, "messages": [{"role": "user", "content": content}],
                                "max_tokens": max_tokens, "temperature": 0.1})
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

async def chat(messages: list, model: str = "", max_tokens: int = 2048) -> str:
    # Provider-agnostic: OpenRouter > Groq > OpenAI > local stub
    for key, base, mdl in [
        (os.getenv("OPENROUTER_API_KEY"), "https://openrouter.ai/api/v1", os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct")),
        (os.getenv("GROQ_API_KEY"), "https://api.groq.com/openai/v1", os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")),
        (os.getenv("OPENAI_API_KEY"), "https://api.openai.com/v1", "gpt-4o-mini"),
    ]:
        if not key: continue
        try:
            async with httpx.AsyncClient(timeout=60) as c:
                r = await c.post(f"{base}/chat/completions", headers={"Authorization": f"Bearer {key}"},
                                  json={"model": model or mdl, "messages": messages, "max_tokens": max_tokens})
                r.raise_for_status()
                return r.json()["choices"][0]["message"]["content"]
        except Exception:
            continue
    # Deterministic local fallback (resume-grounded, no hallucination)
    last = messages[-1]["content"][:400] if messages else ""
    return f"Thanks — building on your resume context ({last[:120]}…). Can you go one level deeper into implementation and trade-offs?"
def evaluate_stub(transcript: str) -> dict:
    return {"answer_quality": 8.0, "technical_correctness": 7.8, "communication": 8.2, "problem_solving": 7.5,
            "attitude_confidence": 8.0, "overall_recommendation": 7.9,
            "feedback_details": {k: "Good, add depth + metrics." for k in ["answer_quality", "technical_correctness", "communication", "problem_solving", "attitude_confidence", "overall_recommendation"]},
            "summary": "Strong ownership; deepen system-design reasoning.", "strengths": ["Project ownership", "Communication"], "areas_for_improvement": ["Scaling trade-offs", "Metrics"]}
