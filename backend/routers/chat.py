import asyncio
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import httpx
import os

from engine.agent_session import get_session, set_session, AgentSession
from engine.queue import submit_job
from middleware.rate_limit import check_rate_limit
from utils.pocketbase import get_or_create_session_config, persist_message

PB_URL = os.getenv("PB_URL", "https://pocketbase.vpjoshi.in")

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


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


@router.post("/{agent_id}")
async def chat(
    agent_id: str,
    body: ChatRequest,
    authorization: str = Header(...),
):
    # 1. Verify token + get user
    auth_data = await get_current_user(authorization)
    user = auth_data["record"]
    user_id = user["id"]
    tier = user.get("tier", "free")

    # 2. Check rate limit
    check_rate_limit(user_id, tier)

    # 3. Get or rehydrate session
    session = get_session(agent_id)

    if not session:
        config = await get_or_create_session_config(agent_id, authorization)
        if not config:
            raise HTTPException(status_code=404, detail="Agent not found")

        if config.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not your agent")

        session = AgentSession(agent_id, config)
        set_session(agent_id, session)

    # 4. Submit to queue and wait
    job = await submit_job(agent_id, user_id, body.message)

    try:
        reply = await asyncio.wait_for(job.future, timeout=120)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Inference timed out. Server may be busy.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 5. Persist messages to PocketBase in background
    asyncio.create_task(persist_message(agent_id, "user", body.message, authorization))
    asyncio.create_task(persist_message(agent_id, "assistant", reply, authorization))

    return {
        "agent_id": agent_id,
        "reply": reply,
        "job_id": job.job_id,
    }


@router.get("/{agent_id}/history")
async def get_history(
    agent_id: str,
    authorization: str = Header(...),
):
    await get_current_user(authorization)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{PB_URL}/api/collections/messages/records",
            headers={"Authorization": authorization},
            params={
                "filter": f'agent_id="{agent_id}"',
                "sort": "created",
                "perPage": 100,
            }
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "agent_id": agent_id,
            "messages": [
                {"role": m["role"], "content": m["content"], "created": m["created"]}
                for m in data.get("items", [])
            ]
        }