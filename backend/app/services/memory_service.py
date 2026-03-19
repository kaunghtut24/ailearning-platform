import json
import logging
from app.core.database import get_db
import app.services.ai_service as ai_service

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

async def get_conversation_history(user_id: int, conversation_id: str = None) -> list[str]:
    """Alias for get_history (user-requested name), with optional level-agnostic retrieval."""
    if not conversation_id:
        # Fallback – this might need logic to pick the latest if unknown
        # For now, just pick an empty or first one to satisfy the type.
        convs = get_conversations(user_id)
        if convs:
            conversation_id = convs[0]['id']
        else:
            return []
    return get_history(user_id, conversation_id)


async def extract_learning_insights(message: str, response: str) -> dict:
    """Analyze student behavior using AI (user-requested)."""
    
    prompt = f"""
    Analyze the student's learning behavior.

    Student message:
    {message}

    AI response:
    {response}

    Extract:
    - topics_understood
    - topics_struggling
    - learning_style (short / long / confused / confident)

    Return JSON only.
    """

    result = await ai_service.generate(prompt)

    try:
        # Basic cleanup in case JSON block markers are present
        cleaned_result = result.strip()
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:-3].strip()
        elif cleaned_result.startswith("```"):
            cleaned_result = cleaned_result[3:-3].strip()
        return json.loads(cleaned_result)
    except Exception as exc:
        logger.error("[memory] extract_learning_insights failed: %s", exc)
        return {
            "topics_understood": [],
            "topics_struggling": [],
            "learning_style": "unknown"
        }

async def save_message(user_id: int, message: str, response: str, conversation_id: str = None) -> None:
    """Alias for storing both user and AI message into memory – now with AI insights."""
    import uuid
    
    if not conversation_id:
        convs = get_conversations(user_id)
        if convs:
            conversation_id = convs[0]['id']
        else:
            conversation_id = str(uuid.uuid4())
            
    if not conversation_exists(conversation_id):
        title = "Self-generated Title"
        create_conversation(user_id, conversation_id, title)
            
    add_message(user_id, conversation_id, "user", message)
    add_message(user_id, conversation_id, "ai", response)
    
    # 2 & 3. Extract and store learning insights
    insights = await extract_learning_insights(message, response)
    
    conn = get_db()
    with conn:
        conn.execute(
            """
            INSERT INTO learning_insights (user_id, topics_understood, topics_struggling, learning_style)
            VALUES (?, ?, ?, ?)
            """,
            (
                user_id,
                json.dumps(insights.get("topics_understood", [])),
                json.dumps(insights.get("topics_struggling", [])),
                insights.get("learning_style", "unknown")
            )
        )
    conn.close()
    logger.info("[memory] Learning insights saved for user_id=%s", user_id)
async def get_latest_insights(user_id: int) -> dict:
    """Fetch the most recent learning insights for a user."""
    conn = get_db()
    cursor = conn.execute(
        "SELECT topics_understood, topics_struggling, learning_style FROM learning_insights WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "topics_understood": json.loads(row["topics_understood"]),
            "topics_struggling": json.loads(row["topics_struggling"]),
            "learning_style": row["learning_style"]
        }
    return {
        "topics_understood": [],
        "topics_struggling": [],
        "learning_style": "unknown"
    }
