from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import httpx
import os

from engine.agent_session import delete_session

PB_URL = os.getenv("PB_URL", "https://pocketbase.vpjoshi.in")

router = APIRouter()


class CreateAgentRequest(BaseModel):
    name: str
    system_prompt: str
    model: Optional[str] = "llama3.2:1b"
    api_key: Optional[str] = None
    tools: Optional[list[str]] = []
    memory_enabled: Optional[bool] = True


async def get_current_user(token: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{PB_URL}/api/collections/users/auth-refresh",
            headers={"Authorization": token}
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        resp.raise_for_status()
        return resp.json()


@router.post("")
async def create_agent(
    body: CreateAgentRequest,
    authorization: str = Header(...),
):
    auth_data = await get_current_user(authorization)
    user = auth_data["record"]
    user_id = user["id"]
    tier = user.get("tier", "free")

    AGENT_LIMITS = {"free": 2, "lite": 5, "pro": 999, "business": 999}
    limit = AGENT_LIMITS.get(tier, 2)

    headers = {"Authorization": authorization}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{PB_URL}/api/collections/agents/records",
            headers=headers,
            params={"filter": f'owner_id="{user_id}"', "perPage": 1},
        )
        resp.raise_for_status()
        total = resp.json().get("totalItems", 0)

    if total >= limit:
        raise HTTPException(
            status_code=403,
            detail={"error": "agent_limit_reached", "limit": limit, "tier": tier}
        )

    payload = {
        "owner_id": user_id,
        "name": body.name,
        "system_prompt": body.system_prompt,
        "model": body.model,
        "api_key": body.api_key or "",
        "tools": body.tools,
        "memory_enabled": body.memory_enabled,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{PB_URL}/api/collections/agents/records",
            headers={"Authorization": authorization, "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@router.get("")
async def list_agents(authorization: str = Header(...)):
    auth_data = await get_current_user(authorization)
    user_id = auth_data["record"]["id"]

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{PB_URL}/api/collections/agents/records",
            headers={"Authorization": authorization},
            params={"filter": f'owner_id="{user_id}"', "sort": "-created"},
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/{agent_id}")
async def get_agent(agent_id: str, authorization: str = Header(...)):
    await get_current_user(authorization)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{PB_URL}/api/collections/agents/records/{agent_id}",
            headers={"Authorization": authorization},
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Agent not found")
        resp.raise_for_status()
        return resp.json()


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, authorization: str = Header(...)):
    await get_current_user(authorization)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.delete(
            f"{PB_URL}/api/collections/agents/records/{agent_id}",
            headers={"Authorization": authorization},
        )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Agent not found")
        resp.raise_for_status()

    delete_session(agent_id)
    return {"deleted": agent_id}