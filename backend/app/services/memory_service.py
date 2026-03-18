import logging
from app.core.database import get_db

logger = logging.getLogger(__name__)

# Cap conversation history to prevent Gemini prompt token overflow.
MAX_HISTORY_TURNS = 20

def get_history(user_id: int, conversation_id: str) -> list[str]:
    """Return the message history for a (user, conversation) pair (oldest first)."""
    conn = get_db()
    cursor = conn.execute(
        "SELECT role, content FROM (SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?) ORDER BY created_at ASC",
        (conversation_id, MAX_HISTORY_TURNS)
    )
    rows = cursor.fetchall()
    conn.close()
    
    # Prefix mapping for AI compatibility
    history = []
    for row in rows:
        prefix = "User" if row["role"] == "user" else "AI"
        history.append(f"{prefix}: {row['content']}")
        
    logger.info(
        "[memory] get_history user_id=%s conversation_id=%s — %d message(s)",
        user_id,
        conversation_id,
        len(history),
    )
    return history

def add_message(user_id: int, conversation_id: str, role: str, content: str) -> None:
    """Append a message to the (user, conversation) history."""
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (conversation_id, role, content)
        )
    conn.close()
    logger.info(
        "[memory] add_message role=%s conversation_id=%s",
        role,
        conversation_id,
    )

def conversation_exists(conversation_id: str) -> bool:
    """Check if a conversation already exists in the database."""
    conn = get_db()
    cursor = conn.execute("SELECT 1 FROM conversations WHERE id = ? LIMIT 1", (conversation_id,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

def create_conversation(user_id: int, conversation_id: str, title: str) -> None:
    """Create a new conversation if it does not already exist."""
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)",
            (conversation_id, user_id, title)
        )
    conn.close()
    logger.info("[memory] create_conversation user_id=%s conversation_id=%s title=%s", user_id, conversation_id, title)

def get_conversations(user_id: int, query: str = None) -> list:
    """Fetch all conversations for a specific user. Filters by title if query is provided."""
    conn = get_db()
    
    if query:
        cursor = conn.execute(
            "SELECT id, user_id, title, created_at FROM conversations WHERE user_id = ? AND title LIKE ? ORDER BY created_at DESC",
            (user_id, f"%{query}%")
        )
    else:
        cursor = conn.execute(
            "SELECT id, user_id, title, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
        
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_conversation_title(conversation_id: str, title: str) -> None:
    conn = get_db()
    with conn:
        conn.execute("UPDATE conversations SET title = ? WHERE id = ?", (title, conversation_id))
    conn.close()
    logger.info("[memory] update_conversation_title conversation_id=%s title=%s", conversation_id, title)

def delete_conversation(conversation_id: str) -> None:
    conn = get_db()
    with conn:
        # Delete messages first due to foreign key (even if ON DELETE CASCADE is omitted)
        conn.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
        conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    conn.close()
    logger.info("[memory] delete_conversation conversation_id=%s", conversation_id)

def get_messages(conversation_id: str) -> list:
    """Fetch raw messages for a conversation without string prefixing."""
    conn = get_db()
    cursor = conn.execute(
        "SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
        (conversation_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def search_messages(user_id: int, query: str) -> list:
    """Search deeply through message content across all conversations."""
    conn = get_db()
    cursor = conn.execute(
        """
        SELECT m.conversation_id, m.content, c.title
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.user_id = ? AND m.content LIKE ?
        ORDER BY m.created_at DESC
        """,
        (user_id, f"%{query}%")
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
