from datetime import datetime
from typing import Optional


class AgentSession:
    """
    Runtime object for a live agent.
    Config is loaded from PocketBase on first request (or after restart).
    Memory lives in-memory only — flushed to PocketBase periodically.
    """

    def __init__(self, agent_id: str, config: dict):
        self.agent_id = agent_id
        self.owner_id = config.get("owner_id")
        self.name = config.get("name", "Agent")
        self.system_prompt = config.get("system_prompt", "You are a helpful assistant. Be concise. Max 2-3 sentences.")
        self.model = config.get("model", "llama3.2:1b")       # "llama3.2:1b" or "openai/gpt-4o" etc
        self.api_key = config.get("api_key", None)             # None = use Ollama free tier
        self.tools = config.get("tools", [])                   # ["calendar", "web_search", "agent_comms"]
        self.memory_enabled = config.get("memory_enabled", True)

        # In-memory conversation history
        self.messages: list[dict] = []

        # Rehydrate from persisted history if passed in
        if config.get("history"):
            self.messages = config["history"]

        self.created_at = datetime.utcnow()
        self.last_used = datetime.utcnow()

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        self.last_used = datetime.utcnow()
        # Keep last 50 messages in memory max
        if len(self.messages) > 50:
            self.messages = self.messages[-50:]

    def get_context(self) -> list[dict]:
        """Returns full message history for inference."""
        return self.messages

    def is_expired(self, ttl_days: int = 7) -> bool:
        delta = datetime.utcnow() - self.last_used
        return delta.days >= ttl_days

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "owner_id": self.owner_id,
            "name": self.name,
            "model": self.model,
            "tools": self.tools,
            "last_used": self.last_used.isoformat(),
            "message_count": len(self.messages),
        }


# Global session store — keyed by agent_id
# In production this would be Redis. For demo, in-memory is fine.
_sessions: dict[str, AgentSession] = {}


def get_session(agent_id: str) -> Optional[AgentSession]:
    return _sessions.get(agent_id)


def set_session(agent_id: str, session: AgentSession):
    _sessions[agent_id] = session


def delete_session(agent_id: str):
    _sessions.pop(agent_id, None)


def get_all_sessions() -> dict[str, AgentSession]:
    return _sessions


def purge_expired_sessions(ttl_days: int = 7):
    """Call this on a background task or startup."""
    expired = [aid for aid, s in _sessions.items() if s.is_expired(ttl_days)]
    for aid in expired:
        del _sessions[aid]
    return len(expired)