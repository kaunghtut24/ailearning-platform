import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

# Cap conversation history to prevent Gemini prompt token overflow.
# Each turn is one entry ("User: ..." or "AI: ..."), so 20 entries ≈ 10 exchanges.
MAX_HISTORY_TURNS = 20

# In-memory store: { user_id -> [msg1, msg2, ...] }
_store: dict[int, list[str]] = defaultdict(list)


def get_history(user_id: int) -> list[str]:
    """Return the full message history for a user (oldest first)."""
    history = _store[user_id]
    logger.info("[memory] get_history user_id=%s — %d message(s)", user_id, len(history))
    return list(history)


def add_message(user_id: int, message: str) -> None:
    """Append a single message to the user's history, trimming oldest turns if needed."""
    _store[user_id].append(message)
    if len(_store[user_id]) > MAX_HISTORY_TURNS:
        _store[user_id] = _store[user_id][-MAX_HISTORY_TURNS:]
    logger.info("[memory] add_message user_id=%s — total=%d", user_id, len(_store[user_id]))

