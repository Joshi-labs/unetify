import asyncio
import uuid
from datetime import datetime
from typing import Optional

# --- Queue item ---

class QueueItem:
    def __init__(self, agent_id: str, user_id: str, message: str):
        self.job_id = str(uuid.uuid4())[:8]
        self.agent_id = agent_id
        self.user_id = user_id
        self.message = message
        self.status = "waiting"        # waiting | running | done | failed
        self.result: Optional[str] = None
        self.error: Optional[str] = None
        self.queued_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.finished_at: Optional[datetime] = None
        self.future: asyncio.Future = asyncio.get_event_loop().create_future()

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "status": self.status,
            "queued_at": self.queued_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
        }


# --- Global queue state ---

_queue: asyncio.Queue = asyncio.Queue()
_active_jobs: dict[str, QueueItem] = {}   # job_id -> QueueItem (all recent jobs)
MAX_TRACKED_JOBS = 50


def get_queue_snapshot() -> list[dict]:
    """
    Returns current queue state for the UI.
    Shows running job first, then waiting jobs in order.
    """
    jobs = list(_active_jobs.values())
    jobs.sort(key=lambda j: j.queued_at)
    return [j.to_dict() for j in jobs if j.status in ("waiting", "running")]


def get_queue_depth() -> int:
    return _queue.qsize()


# --- Submit a job ---

async def submit_job(agent_id: str, user_id: str, message: str) -> QueueItem:
    item = QueueItem(agent_id, user_id, message)
    _active_jobs[item.job_id] = item

    # Prune old completed jobs if too many tracked
    completed = [jid for jid, j in _active_jobs.items() if j.status in ("done", "failed")]
    if len(completed) > MAX_TRACKED_JOBS:
        for jid in completed[:10]:
            del _active_jobs[jid]

    await _queue.put(item)
    return item


# --- Worker - runs as a background task on startup ---

async def inference_worker(run_inference_fn):
    """
    Single worker that drains the queue one job at a time.
    run_inference_fn(item: QueueItem) -> str  (the model response)
    Pass this in from main.py so the worker stays decoupled.
    """
    while True:
        item: QueueItem = await _queue.get()

        item.status = "running"
        item.started_at = datetime.utcnow()

        try:
            result = await run_inference_fn(item)
            item.result = result
            item.status = "done"
            item.future.set_result(result)
        except Exception as e:
            item.error = str(e)
            item.status = "failed"
            if not item.future.done():
                item.future.set_exception(e)
        finally:
            item.finished_at = datetime.utcnow()
            _queue.task_done()