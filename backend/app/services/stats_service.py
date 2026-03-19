import logging
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
