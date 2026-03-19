import logging
from app.agents.assessment_agent import AssessmentAgent

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    def __init__(self, memory_service, level_service, instructor_agent):
        self.memory_service = memory_service
        self.level_service = level_service
        self.instructor_agent = instructor_agent
        self.assessment_agent = AssessmentAgent()

    async def process_message(self, user_id: int, message: str, level: str = None, conversation_id: str = None):
        
        # 1. Fetch memory
        history = await self.memory_service.get_conversation_history(user_id, conversation_id)

        # 2. Detect level if not provided
        if not level:
            level = self.level_service.detect_level(message)

        # 3. Fetch latest insights for personalization
        insights = await self.memory_service.get_latest_insights(user_id)

        # 4. Call instructor agent
        response = await self.instructor_agent.run({
            "question": message,
            "level": level,
            "history": history,
            "insights": insights
        })

        # 4. Store memory (includes generating/saving conversation_id if missing)
        # Note: We'll need to know which CID was used.
        # But for now let's just use the provided one or let the service handle it.
        await self.memory_service.save_message(user_id, message, response["answer"], conversation_id)

        # 5. Generate a quiz question for assessment
        quiz = await self.assessment_agent.generate_quiz(
            topic=message,
            level=level,
            insights=insights
        )

        return {
            "answer": response["answer"],
            "level": level,
            "conversation_id": conversation_id,
            "quiz": quiz
        }
