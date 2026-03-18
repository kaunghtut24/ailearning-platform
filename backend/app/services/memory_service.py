import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

# Cap conversation history to prevent Gemini prompt token overflow.
# Each turn is one entry ("User: ..." or "AI: ..."), so 20 entries ≈ 10 exchanges.
MAX_HISTORY_TURNS = 20

# In-memory store: { (user_id, conversation_id) -> [msg1, msg2, ...] }
# Keyed by conversation so each session has its own independent history.
_store: dict[tuple[int, str], list[str]] = defaultdict(list)


def get_history(user_id: int, conversation_id: str) -> list[str]:
    """Return the message history for a (user, conversation) pair (oldest first)."""
    key = (user_id, conversation_id)
    history = _store[key]
    logger.info(
        "[memory] get_history user_id=%s conversation_id=%s — %d message(s)",
        user_id,
        conversation_id,
        len(history),
    )
    return list(history)


def add_message(user_id: int, conversation_id: str, message: str) -> None:
    """Append a message to the (user, conversation) history, trimming oldest if needed."""
    key = (user_id, conversation_id)
    _store[key].append(message)
    if len(_store[key]) > MAX_HISTORY_TURNS:
        _store[key] = _store[key][-MAX_HISTORY_TURNS:]
    logger.info(
        "[memory] add_message user_id=%s conversation_id=%s — total=%d",
        user_id,
        conversation_id,
        len(_store[key]),
    )

