from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.assessment_agent import AssessmentAgent

router = APIRouter()
agent = AssessmentAgent()

class EvaluateRequest(BaseModel):
    question: str
    answer: str

@router.post("/evaluate")
async def evaluate(req: EvaluateRequest):
    result = await agent.evaluate_answer(req.question, req.answer)
    return result
