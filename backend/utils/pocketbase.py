import os
import httpx

PB_URL = os.getenv("PB_URL", "https://pocketbase.vpjoshi.in")


async def get_agent_config(agent_id: str, pb_token: str) -> dict | None:
    """Fetch agent config from PocketBase. Returns None if not found."""
    headers = {"Authorization": pb_token}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{PB_URL}/api/collections/agents/records/{agent_id}", headers=headers)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()


async def get_agent_history(agent_id: str, pb_token: str, limit: int = 30) -> list[dict]:
    """Fetch last N messages for an agent to rehydrate session memory."""
    headers = {"Authorization": pb_token}
    params = {
        "filter": f'agent_id="{agent_id}"',
        "sort": "-created",
        "perPage": limit,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{PB_URL}/api/collections/messages/records", headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        # Reverse so oldest is first (chronological order)
        items.reverse()
        return [{"role": m["role"], "content": m["content"]} for m in items]


async def persist_message(agent_id: str, role: str, content: str, pb_token: str):
    """Save a single message to PocketBase."""
    headers = {"Authorization": pb_token, "Content-Type": "application/json"}
    payload = {"agent_id": agent_id, "role": role, "content": content}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(f"{PB_URL}/api/collections/messages/records", headers=headers, json=payload)
        resp.raise_for_status()


async def get_or_create_session_config(agent_id: str, pb_token: str) -> dict | None:
    """
    Full rehydration helper.
    Returns config dict with history injected, ready to pass into AgentSession().
    """
    config = await get_agent_config(agent_id, pb_token)
    if not config:
        return None
    history = await get_agent_history(agent_id, pb_token)
    config["history"] = history
    return config