import logging
from app.agents.assessment_agent import AssessmentAgent
from app.services.stats_service import get_topic_progress

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

        # 4. Fetch and classify topic progress for adaptive teaching
        raw_topics = get_topic_progress(user_id)
        weak_topics = [
            t["topic"] for t in raw_topics
            if t["wrong_count"] >= t["correct_count"] and (t["wrong_count"] + t["correct_count"]) > 0
        ]
        strong_topics = [
            t["topic"] for t in raw_topics
            if t["correct_count"] > t["wrong_count"]
        ]
        topic_progress = {
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
        }

        # 5. Call instructor agent with full context
        response = await self.instructor_agent.run({
            "question": message,
            "level": level,
            "history": history,
            "insights": insights,
            "topic_progress": topic_progress,
        })

        # 6. Store memory
        await self.memory_service.save_message(user_id, message, response["answer"], conversation_id)

        # 7. Generate a quiz question for assessment
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
