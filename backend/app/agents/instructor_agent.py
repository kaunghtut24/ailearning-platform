import logging

from app.agents.base_agent import BaseAgent
from app.services.ai_service import generate_response, generate

logger = logging.getLogger(__name__)


class InstructorAgent(BaseAgent):
    """
    Adaptive instructor that tailors every explanation based on:
    - Student level  (primary / middle / secondary)
    - Learning insights (topics struggling, understood, style)
    - Quiz-based topic performance (weak / strong topics)
    """

    async def run(self, input_data: dict) -> dict:
        question: str = input_data.get("question") or input_data.get("message", "")
        history: list[str] = input_data.get("history", [])
        level: str = input_data.get("level", "primary")
        insights: dict = input_data.get("insights", {})
        topic_progress: dict = input_data.get("topic_progress", {})

        weak_topics: list[str] = topic_progress.get("weak_topics", [])
        strong_topics: list[str] = topic_progress.get("strong_topics", [])

        logger.info(
            "[InstructorAgent] run — level=%s question=%r history_turns=%d "
            "weak=%s strong=%s",
            level,
            question,
            len(history),
            weak_topics,
            strong_topics,
        )

        def _fmt(topics: list[str], fallback: str) -> str:
            """Format a topic list as a bulleted string, or return a fallback."""
            return "\n".join(f"  - {t}" for t in topics) if topics else f"  {fallback}"

        weak_section = _fmt(weak_topics, "(none recorded yet)")
        strong_section = _fmt(strong_topics, "(none recorded yet)")
        history_section = "\n".join(history) if history else "(start of conversation)"

        prompt = f"""
You are an expert AI teacher who adapts every explanation to the individual student.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level: {level}
Learning style: {insights.get("learning_style", "unknown")}

Topics the student currently struggles with (from chat history):
  {insights.get("topics_struggling", [])}

Topics the student understands well (from chat history):
  {insights.get("topics_understood", [])}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUIZ-BASED TOPIC PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weak topics (student answered more wrong than correct in quizzes):
{weak_section}

Strong topics (student answered more correct than wrong in quizzes):
{strong_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADAPTIVE TEACHING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. If the question relates to a WEAK topic:
   → Use simpler language and break the concept into small numbered steps
   → Add a concrete, relatable real-world example
   → Be encouraging and patient in tone
   → End with an offer to elaborate if anything is unclear

2. If the question relates to a STRONG topic:
   → Go deeper — introduce nuances, edge cases, or related advanced concepts
   → Use precise, subject-appropriate terminology
   → Pose a challenging follow-up question to push their thinking further

3. If the topic is UNKNOWN (no quiz data yet):
   → Teach at the appropriate level for the student's grade
   → Keep explanations clear, structured, and engaging

4. Always match the student's level — {level}:
   → primary:   simple words, everyday analogies, short sentences
   → middle:    moderate detail, some subject terminology, examples
   → secondary: technical depth, precise language, conceptual reasoning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{history_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT'S QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{question}
"""

        response = await generate(prompt)

        logger.info(
            "[InstructorAgent] response ready (weak=%d strong=%d)",
            len(weak_topics),
            len(strong_topics),
        )
        return {"response": response, "answer": response}
