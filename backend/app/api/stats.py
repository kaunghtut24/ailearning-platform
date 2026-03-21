from fastapi import APIRouter
from app.services.stats_service import get_user_stats, get_topic_progress
from app.core.database import get_db

router = APIRouter()

@router.get("/stats/{user_id}")
async def fetch_user_stats(user_id: int):
    return get_user_stats(user_id)

@router.get("/stats/{user_id}/streak")
async def fetch_user_streak(user_id: int):
    conn = get_db()
    cursor = conn.execute(
        "SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"current_streak": 0, "longest_streak": 0}
    return {"current_streak": row["current_streak"], "longest_streak": row["longest_streak"]}

@router.get("/stats/{user_id}/topics")
async def fetch_topic_progress(user_id: int):
    """
    Returns all topic progress entries for a user.
    Each entry: { topic, correct_count, wrong_count, last_updated }
    Frontend can classify:
      - strong: correct_count > wrong_count
      - weak:   wrong_count >= correct_count (with at least 1 attempt)
    """
    topics = get_topic_progress(user_id)
    return {"topics": topics}
