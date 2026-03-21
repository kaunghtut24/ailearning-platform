from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.assessment_agent import AssessmentAgent
from app.services.stats_service import update_user_stats, update_streak

router = APIRouter()
agent = AssessmentAgent()

class EvaluateRequest(BaseModel):
    user_id: int = 1
    question: str
    answer: str

@router.post("/evaluate")
async def evaluate(req: EvaluateRequest):
    result = await agent.evaluate_answer(req.question, req.answer)
    
    score = result.get("score", 0)
    is_correct = result.get("correct", False)
    
    print("\n[EVALUATION DEBUG] Evaluation result:", result)
    print(f"[EVALUATION DEBUG] Points awarded: {score} | Correct: {is_correct}\n")
    
    # Save student metrics
    update_user_stats(req.user_id, score, is_correct)

    # Update daily streak and include it in the response
    current_streak = update_streak(req.user_id)
    
    return {**result, "streak": current_streak}

