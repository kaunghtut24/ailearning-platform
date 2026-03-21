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


def update_streak(user_id: int) -> tuple[int, bool]:
    """
    Update the daily streak for a user and return the (current streak count, is_first_activity_today).
    - New user           → streak starts at 1, True
    - Already active today → no change, return current streak, False
    - Active yesterday   → increment streak, True
    - Gap in activity    → reset streak to 1, True
    """
    today = date.today()
    yesterday = today - timedelta(days=1)

    conn = get_db()
    is_first_today = False
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
            is_first_today = True
            logger.info(f"[streak] user_id={user_id} — new record, streak=1")

        else:
            last_active = date.fromisoformat(row["last_active_date"])
            current_streak = row["current_streak"]
            longest_streak = row["longest_streak"]

            if last_active == today:
                # Already counted today — nothing to do
                is_first_today = False
                logger.info(f"[streak] user_id={user_id} — already active today, streak={current_streak}")
            elif last_active == yesterday:
                # Consecutive day — extend the streak
                current_streak += 1
                is_first_today = True
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
                is_first_today = True
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
    return current_streak, is_first_today


def calculate_streak_reward(streak: int) -> int:
    """Calculate reward points based on streak milestones."""
    if streak == 1:
        return 2
    elif streak == 3:
        return 5
    elif streak == 7:
        return 15
    elif streak == 14:
        return 30
    else:
        return 0


def add_points(user_id: int, points: int):
    """Directly add points to a user's total_points."""
    if points <= 0:
        return
        
    conn = get_db()
    with conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO user_stats (user_id, total_points, total_quizzes, correct_answers)
            VALUES (?, 0, 0, 0)
            """,
            (user_id,)
        )
        conn.execute(
            "UPDATE user_stats SET total_points = total_points + ? WHERE user_id = ?",
            (points, user_id)
        )
    conn.close()
    logger.info(f"[stats] Added {points} reward points to user_id={user_id}")



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


def update_topic_progress(user_id: int, topic: str, correct: bool) -> None:
    """
    Upsert topic progress for a user.
    - Creates a new row on first encounter
    - Increments correct_count or wrong_count accordingly
    """
    topic = topic.strip().title()   # normalise casing e.g. "fractions" → "Fractions"
    conn = get_db()
    with conn:
        conn.execute(
            """
            INSERT INTO topic_progress (user_id, topic, correct_count, wrong_count, last_updated)
            VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, topic) DO NOTHING
            """,
            (user_id, topic)
        )
        if correct:
            conn.execute(
                """
                UPDATE topic_progress
                SET correct_count = correct_count + 1, last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND topic = ?
                """,
                (user_id, topic)
            )
        else:
            conn.execute(
                """
                UPDATE topic_progress
                SET wrong_count = wrong_count + 1, last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND topic = ?
                """,
                (user_id, topic)
            )
    conn.close()
    logger.info(f"[topic] user_id={user_id} topic='{topic}' correct={correct}")


def get_topic_progress(user_id: int) -> list[dict]:
    """
    Return all topic progress rows for a user ordered by total attempts (desc).
    Each row: topic, correct_count, wrong_count, last_updated.
    """
    conn = get_db()
    cursor = conn.execute(
        """
        SELECT topic, correct_count, wrong_count, last_updated
        FROM topic_progress
        WHERE user_id = ?
        ORDER BY (correct_count + wrong_count) DESC
        """,
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


VALID_SKILL_TYPES = {"conceptual", "factual", "problem-solving"}

def update_skill_progress(user_id: int, skill_type: str, correct: bool) -> None:
    """
    Upsert skill-type progress for a user.
    skill_type must be one of: conceptual | factual | problem-solving
    Unknown types are silently ignored to avoid polluting data.
    """
    skill_type = skill_type.lower().strip()
    if skill_type not in VALID_SKILL_TYPES:
        logger.warning(f"[skill] Ignoring unknown skill_type={skill_type!r} for user_id={user_id}")
        return

    conn = get_db()
    with conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO skill_progress (user_id, skill_type, correct_count, wrong_count)
            VALUES (?, ?, 0, 0)
            """,
            (user_id, skill_type)
        )
        if correct:
            conn.execute(
                "UPDATE skill_progress SET correct_count = correct_count + 1 WHERE user_id = ? AND skill_type = ?",
                (user_id, skill_type)
            )
        else:
            conn.execute(
                "UPDATE skill_progress SET wrong_count = wrong_count + 1 WHERE user_id = ? AND skill_type = ?",
                (user_id, skill_type)
            )
    conn.close()
    logger.info(f"[skill] user_id={user_id} skill_type='{skill_type}' correct={correct}")


def get_skill_progress(user_id: int) -> list[dict]:
    """
    Return skill progress for all recorded skill types for a user.
    Each row: skill_type, correct_count, wrong_count, accuracy (0-100).
    """
    conn = get_db()
    cursor = conn.execute(
        """
        SELECT skill_type, correct_count, wrong_count
        FROM skill_progress
        WHERE user_id = ?
        ORDER BY skill_type
        """,
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        total = row["correct_count"] + row["wrong_count"]
        accuracy = round(row["correct_count"] / total * 100, 1) if total > 0 else 0
        result.append({
            "skill_type": row["skill_type"],
            "correct_count": row["correct_count"],
            "wrong_count": row["wrong_count"],
            "accuracy": accuracy,
        })
    return result
