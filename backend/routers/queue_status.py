from fastapi import APIRouter, Header, HTTPException
import httpx
import os

from engine.queue import get_queue_snapshot, get_queue_depth

PB_URL = os.getenv("PB_URL", "https://pocketbase.vpjoshi.in")

router = APIRouter()


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


@router.get("")
async def queue_status(authorization: str = Header(...)):
    await get_current_user(authorization)
    return {
        "depth": get_queue_depth(),
        "jobs": get_queue_snapshot(),
    }


@router.get("/depth")
async def queue_depth(authorization: str = Header(...)):
    await get_current_user(authorization)
    return {"depth": get_queue_depth()}