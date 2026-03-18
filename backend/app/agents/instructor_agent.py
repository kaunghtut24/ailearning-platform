import logging

from app.agents.base_agent import BaseAgent
from app.services.ai_service import generate_response

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
        message: str = input_data["message"]
        history: list[str] = input_data.get("history", [])
        level: str = input_data.get("level", "primary")
        profile: str = input_data.get("profile", "")

        logger.info(
            "[InstructorAgent] run — level=%s message=%r history_turns=%d profile_len=%d",
            level,
            message,
            len(history),
            len(profile),
        )

        response = await generate_response(message, history=history, level=level, profile=profile)

        logger.info("[InstructorAgent] response ready")
        return {"response": response}

