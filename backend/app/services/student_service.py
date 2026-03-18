import json
import logging
from app.core.database import get_db

logger = logging.getLogger(__name__)

def get_profile(user_id: int) -> str:
    """Returns a string representation of the student profile for prompting."""
    conn = get_db()
    cursor = conn.execute("SELECT strengths, weaknesses, topics_learned FROM student_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return f"Strengths: {row['strengths']}, Weaknesses: {row['weaknesses']}, Topics Learned: {row['topics_learned']}"
    return "Strengths: [], Weaknesses: [], Topics Learned: []"

def update_profile(user_id: int, message: str, response: str) -> None:
    """Updates the student profile based on simple keyword extraction from the message."""
    message_lower = message.lower()
    new_strengths = []
    new_weaknesses = []
    new_topics = []
    
    if "good at" in message_lower or "i know" in message_lower or "i understand" in message_lower:
        new_strengths.append("Shows confidence in subject matter")
    if "hard" in message_lower or "don't understand" in message_lower or "struggle" in message_lower:
        new_weaknesses.append("Struggles with understanding topics easily")
    if "explain" in message_lower or "what is" in message_lower or "how to" in message_lower:
        new_topics.append("Actively asks foundational questions")
        
    if not (new_strengths or new_weaknesses or new_topics):
        return
        
    conn = get_db()
    cursor = conn.execute("SELECT strengths, weaknesses, topics_learned FROM student_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    
    if row:
        strengths = json.loads(row['strengths'])
        weaknesses = json.loads(row['weaknesses'])
        topics = json.loads(row['topics_learned'])
    else:
        strengths, weaknesses, topics = [], [], []
        
    for s in new_strengths:
        if s not in strengths: strengths.append(s)
    for w in new_weaknesses:
        if w not in weaknesses: weaknesses.append(w)
    for t in new_topics:
        if t not in topics: topics.append(t)
        
    with conn:
        conn.execute(
            """
            INSERT INTO student_profiles (user_id, strengths, weaknesses, topics_learned)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
            strengths=excluded.strengths,
            weaknesses=excluded.weaknesses,
            topics_learned=excluded.topics_learned
            """,
            (user_id, json.dumps(strengths), json.dumps(weaknesses), json.dumps(topics))
        )
    conn.close()
    logger.info("[student_service] Profile updated for user_id=%s", user_id)
