import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from engine.queue import inference_worker
from engine.agent_session import purge_expired_sessions
from engine.ollama import run_inference as ollama_run
from engine.agent_session import get_session

from routers import agents, chat, queue_status


# --- Inference function passed to the queue worker ---

async def run_inference_job(item):
    """Bridge between QueueItem and the inference engine."""
    session = get_session(item.agent_id)
    if not session:
        raise ValueError(f"Session not found for agent {item.agent_id}")
    return await ollama_run(session, item.message)


# --- Lifespan: start background tasks on boot ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the single inference worker
    worker_task = asyncio.create_task(inference_worker(run_inference_job))

    # Purge expired sessions every hour
    async def purge_loop():
        while True:
            await asyncio.sleep(3600)
            purged = purge_expired_sessions()
            if purged:
                print(f"[purge] Removed {purged} expired sessions")

    purge_task = asyncio.create_task(purge_loop())

    yield

    worker_task.cancel()
    purge_task.cancel()


# --- App ---

app = FastAPI(title="Unetify API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai.unetify.in",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(queue_status.router, prefix="/queue", tags=["queue"])


@app.get("/health")
def health():
    return {"status": "ok"}