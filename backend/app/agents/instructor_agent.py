import logging

from app.services.ai_service import generate_response

logger = logging.getLogger(__name__)


class BaseAgent:
    """Spec §6 — all agents must implement this interface."""

    async def run(self, input_data: dict) -> dict:
        raise NotImplementedError


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

        logger.info(
            "[InstructorAgent] run — level=%s message=%r history_turns=%d",
            level,
            message,
            len(history),
        )

        response = await generate_response(message, history=history, level=level)

        logger.info("[InstructorAgent] response ready")
        return {"response": response}

