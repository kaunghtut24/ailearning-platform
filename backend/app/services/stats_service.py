import logging
from datetime import date, timedelta
from app.core.database import get_db

logger = logging.getLogger(__name__)

def update_user_stats(user_id: int, score: int, is_correct: bool):
    conn = get_db()
    with conn:
        # Ensure user row exists for stats
        conn.execute(
            """
            INSERT OR IGNORE INTO user_stats (user_id, total_points, total_quizzes, correct_answers)
            VALUES (?, 0, 0, 0)
            """,
            (user_id,)
        )
        # Update their tracking
        conn.execute(
            """
            UPDATE user_stats 
            SET total_points = total_points + ?,
                total_quizzes = total_quizzes + 1,
                correct_answers = correct_answers + ?
            WHERE user_id = ?
            """,
            (score, 1 if is_correct else 0, user_id)
        )
    conn.close()
    logger.info(f"[stats] Updated user_id={user_id} with score={score} correct={is_correct}")

def get_user_stats(user_id: int) -> dict:
    conn = get_db()
    cursor = conn.execute(
        "SELECT total_points, total_quizzes, correct_answers FROM user_stats WHERE user_id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {
            "total_points": 0,
            "accuracy": 0,
            "quizzes_taken": 0
        }
        
    total_quizzes = row["total_quizzes"]
    correct_answers = row["correct_answers"]
    accuracy = (correct_answers / total_quizzes * 100) if total_quizzes > 0 else 0
    
    return {
        "total_points": row["total_points"],
        "accuracy": round(accuracy, 1),
        "quizzes_taken": total_quizzes
    }


def update_streak(user_id: int) -> int:
    """
    Update the daily streak for a user and return the current streak count.
    - New user           → streak starts at 1
    - Already active today → no change, return current streak
    - Active yesterday   → increment streak
    - Gap in activity    → reset streak to 1
    """
    today = date.today()
    yesterday = today - timedelta(days=1)

    conn = get_db()
    with conn:
        cursor = conn.execute(
            "SELECT current_streak, longest_streak, last_active_date FROM user_streaks WHERE user_id = ?",
            (user_id,)
        )
        row = cursor.fetchone()

        if not row:
            # First time — create the record with streak = 1
            conn.execute(
                """
                INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
                VALUES (?, 1, 1, ?)
                """,
                (user_id, today.isoformat())
            )
            current_streak = 1
            logger.info(f"[streak] user_id={user_id} — new record, streak=1")

        else:
            last_active = date.fromisoformat(row["last_active_date"])
            current_streak = row["current_streak"]
            longest_streak = row["longest_streak"]

            if last_active == today:
                # Already counted today — nothing to do
                logger.info(f"[streak] user_id={user_id} — already active today, streak={current_streak}")
            elif last_active == yesterday:
                # Consecutive day — extend the streak
                current_streak += 1
                longest_streak = max(longest_streak, current_streak)
                conn.execute(
                    """
                    UPDATE user_streaks
                    SET current_streak = ?, longest_streak = ?, last_active_date = ?
                    WHERE user_id = ?
                    """,
                    (current_streak, longest_streak, today.isoformat(), user_id)
                )
                logger.info(f"[streak] user_id={user_id} — consecutive day, streak={current_streak}")
            else:
                # Streak broken — reset to 1
                current_streak = 1
                longest_streak = max(longest_streak, 1)
                conn.execute(
                    """
                    UPDATE user_streaks
                    SET current_streak = 1, longest_streak = ?, last_active_date = ?
                    WHERE user_id = ?
                    """,
                    (longest_streak, today.isoformat(), user_id)
                )
                logger.info(f"[streak] user_id={user_id} — streak broken, reset to 1")

    conn.close()
    return current_streak


def get_user_streak(user_id: int) -> int:
    """Return the current streak for a user (0 if no record exists)."""
    conn = get_db()
    cursor = conn.execute(
        "SELECT current_streak FROM user_streaks WHERE user_id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    return row["current_streak"] if row else 0

