import os
import httpx
from engine.agent_session import AgentSession

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://192.168.1.10:11434")


async def run_inference(session: AgentSession, user_message: str) -> str:
    """
    Routes to Ollama (free tier) or external API (BYO key).
    Adds user message to session memory, returns assistant reply.
    """
    session.add_message("user", user_message)

    if session.api_key:
        reply = await _run_openai_compatible(session)
    else:
        reply = await _run_ollama(session)

    session.add_message("assistant", reply)
    return reply


# --- Ollama (free tier) ---

async def _run_ollama(session: AgentSession) -> str:
    payload = {
        "model": session.model,
        "messages": _build_messages(session),
        "stream": False,
        "options": {
            "num_predict": 256,   # keep responses short on free tier
        }
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"].strip()


# --- BYO API key (OpenAI-compatible) ---
# Works for OpenAI, Groq, Together, OpenRouter — all use the same schema.

async def _run_openai_compatible(session: AgentSession) -> str:
    # model string format: "openai/gpt-4o", "groq/llama3-70b", etc.
    # We strip the prefix and use the base URL accordingly
    model_str = session.model
    base_url, model_name = _resolve_provider(model_str)

    headers = {
        "Authorization": f"Bearer {session.api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model_name,
        "messages": _build_messages(session),
        "max_tokens": 512,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def _resolve_provider(model_str: str) -> tuple[str, str]:
    """Maps 'provider/model' string to (base_url, model_name)."""
    providers = {
        "openai":    "https://api.openai.com/v1",
        "groq":      "https://api.groq.com/openai/v1",
        "together":  "https://api.together.xyz/v1",
        "openrouter":"https://openrouter.ai/api/v1",
        "gemini":    "https://generativelanguage.googleapis.com/v1beta/openai",
    }
    if "/" in model_str:
        prefix, model_name = model_str.split("/", 1)
        base_url = providers.get(prefix, providers["openai"])
        return base_url, model_name
    # Default to OpenAI if no prefix
    return providers["openai"], model_str


def _build_messages(session: AgentSession) -> list[dict]:
    """Prepends system prompt to conversation history."""
    system = {"role": "system", "content": session.system_prompt}
    return [system] + session.get_context()