from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import Request, HTTPException

# tier -> (requests_per_day)
TIER_LIMITS = {
    "free":     20,
    "lite":     200,
    "pro":      1000,
    "business": 999999,
}

# In-memory store: user_id -> {"count": int, "reset_at": datetime}
_usage: dict[str, dict] = defaultdict(lambda: {"count": 0, "reset_at": datetime.utcnow() + timedelta(days=1)})


def check_rate_limit(user_id: str, tier: str = "free"):
    entry = _usage[user_id]
    now = datetime.utcnow()

    # Reset counter if window has passed
    if now >= entry["reset_at"]:
        entry["count"] = 0
        entry["reset_at"] = now + timedelta(days=1)

    limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

    if entry["count"] >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "limit": limit,
                "tier": tier,
                "resets_at": entry["reset_at"].isoformat(),
            }
        )

    entry["count"] += 1


def get_usage(user_id: str) -> dict:
    entry = _usage[user_id]
    return {
        "used": entry["count"],
        "resets_at": entry["reset_at"].isoformat(),
    }