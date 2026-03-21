from fastapi import APIRouter
from app.services.stats_service import get_user_stats
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
