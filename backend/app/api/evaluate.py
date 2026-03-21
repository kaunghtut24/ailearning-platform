import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.assessment_agent import AssessmentAgent
from app.services.stats_service import (
    update_user_stats,
    update_streak,
    calculate_streak_reward,
    add_points,
    update_topic_progress,
    update_skill_progress,
)

router = APIRouter()
agent = AssessmentAgent()

class EvaluateRequest(BaseModel):
    user_id: int = 1
    question: str
    answer: str
    # Optional: pass the quiz's question_type from the frontend
    # so skill-type tracking stays accurate (conceptual | factual | problem-solving)
    question_type: str | None = None

@router.post("/evaluate")
async def evaluate(req: EvaluateRequest):
    # Step 1: Evaluate the answer + extract topic concurrently
    result, topic = await asyncio.gather(
        agent.evaluate_answer(req.question, req.answer),
        agent.extract_topic(req.question),
    )

    score = result.get("score", 0)
    is_correct = result.get("correct", False)

    print("\n[EVALUATION DEBUG] Evaluation result:", result)
    print(f"[EVALUATION DEBUG] Points awarded: {score} | Correct: {is_correct} | Topic: {topic}\n")

    # Step 2: Save overall student metrics
    update_user_stats(req.user_id, score, is_correct)

    # Step 3: Update topic-level progress
    update_topic_progress(req.user_id, topic, is_correct)

    # Step 4: Update skill-type progress
    # Use the question_type supplied by the client (from the quiz metadata);
    # fall back to "unknown" which will be silently ignored by update_skill_progress.
    skill_type = (req.question_type or "").strip().lower()
    update_skill_progress(req.user_id, skill_type, is_correct)

    # Step 5: Update daily streak
    current_streak, is_first_today = update_streak(req.user_id)

    # Step 6: Grant streak milestone reward (once per day only)
    reward = calculate_streak_reward(current_streak) if is_first_today else 0
    if reward > 0:
        add_points(req.user_id, reward)

    return {
        **result,
        "streak": current_streak,
        "reward": reward,
        "topic": topic,
        "skill_type": skill_type or None,
    }
