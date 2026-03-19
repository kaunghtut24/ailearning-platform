import logging

from app.agents.base_agent import BaseAgent
from app.agents.base_agent import BaseAgent
from app.services.ai_service import generate_response, generate

logger = logging.getLogger(__name__)


class InstructorAgent(BaseAgent):
    """
    Stateless agent that calls the AI service and returns a response.

    Prompt selection and construction is owned entirely by ai_service —
    this agent only extracts and forwards data.

    Input:
        {
            "message": str,
            "history": list[str],  # oldest-first conversation turns
            "level":   str,        # "primary" | "middle" | "secondary"
        }

    Output:
        { "response": str }
    """

    async def run(self, input_data: dict) -> dict:
        question: str = input_data.get("question") or input_data.get("message", "")
        history: list[str] = input_data.get("history", [])
        level: str = input_data.get("level", "primary")
        insights: dict = input_data.get("insights", {})

        logger.info(
            "[InstructorAgent] run with insights — level=%s question=%r history_turns=%d insights=%s",
            level,
            question,
            len(history),
            insights,
        )

        # Build personalized prompt
        prompt = f"""
You are an AI teacher.

Student level: {level}

Student insights:
- Struggling: {insights.get("topics_struggling", [])}
- Strong in: {insights.get("topics_understood", [])}
- Style: {insights.get("learning_style", "unknown")}

Adapt your teaching:
- If struggling → simplify
- If confident → challenge
- Match learning style

Current conversation history:
{"\n".join(history)}

Question:
{question}
"""

        # Use the general purpose generate call for the full personalized prompt
        response = await generate(prompt)

        logger.info("[InstructorAgent] response ready")
        return {"response": response, "answer": response}

