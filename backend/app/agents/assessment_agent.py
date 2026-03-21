import json
import logging
import app.services.ai_service as ai_service

logger = logging.getLogger(__name__)

class AssessmentAgent:
    """Agent responsible for generating short quiz questions to assess student understanding."""

    async def generate_quiz(
        self,
        topic: str,
        level: str,
        insights: dict,
        weak_topics: list[str] | None = None,
        strong_topics: list[str] | None = None,
    ) -> dict:
        """
        Generate ONE targeted quiz question.

        Topic-bias logic:
        - If the student has weak topics → bias toward the first (most-failed) one
        - Otherwise fall back to the current conversation topic
        """
        weak_topics = weak_topics or []
        strong_topics = strong_topics or []

        # Pick the quiz topic: prefer the weakest recorded topic
        quiz_topic = weak_topics[0] if weak_topics else topic

        # Build the weak-topic section for the prompt
        if weak_topics:
            weak_section = "\n".join(f"  - {t}" for t in weak_topics)
            priority_instruction = (
                "PRIORITY: Generate a question specifically about the student's WEAKEST topic "
                f"({weak_topics[0]}). This is the topic they struggle with most. "
                "Reinforce it with a clear, level-appropriate question."
            )
        else:
            weak_section = "  (none recorded yet — quiz on the current topic)"
            priority_instruction = (
                f"No weak topics recorded yet. Generate a question about: {topic}"
            )

        prompt = f"""
        Generate ONE short quiz question for a student.

        ── CONTEXT ──────────────────────────────
        Current conversation topic : {topic}
        Quiz target topic          : {quiz_topic}
        Student level              : {level}

        ── STUDENT WEAK TOPICS (needs reinforcement) ──
{weak_section}

        ── STUDENT STRONG TOPICS (already confident) ──
{chr(10).join(f"  - {t}" for t in strong_topics) if strong_topics else "  (none recorded yet)"}

        ── INSTRUCTIONS ─────────────────────────
        {priority_instruction}

        Additional rules:
        - Ask exactly ONE question — no sub-parts
        - Keep language appropriate for level: {level}
        - If the topic is weak → make it straightforward and conceptual
        - If the topic is strong → make it slightly more challenging
        - Do NOT include the answer or any hint
        - Return ONLY the question text, nothing else
        """

        try:
            logger.info(
                "[AssessmentAgent] Generating quiz — quiz_topic=%r (original=%r) level=%s weak=%s",
                quiz_topic, topic, level, weak_topics,
            )
            question = await ai_service.generate(prompt)
            return {
                "question": question.strip(),
                "quiz_topic": quiz_topic,
            }
        except Exception as exc:
            logger.error("[AssessmentAgent] Failed to generate quiz: %s", exc)
            return {
                "question": "Could you explain what we just talked about in your own words?",
                "quiz_topic": quiz_topic,
            }


    async def evaluate_answer(self, question: str, answer: str) -> dict:
        """Evaluate the student's answer and return score, correctness, and feedback."""
        prompt = f"""
        Evaluate the student's answer.

        Question:
        {question}

        Student Answer:
        {answer}

        Return JSON:
        {{
            "score": 0-10,
            "correct": true/false,
            "feedback": "short explanation"
        }}
        """

        try:
            logger.info("[AssessmentAgent] Evaluating answer for question=%r", question)
            result = await ai_service.generate(prompt)
            
            cleaned_result = result.strip()
            if cleaned_result.startswith("```json"):
                cleaned_result = cleaned_result[7:-3].strip()
            elif cleaned_result.startswith("```"):
                cleaned_result = cleaned_result[3:-3].strip()
                
            return json.loads(cleaned_result)
        except Exception as exc:
            logger.error("[AssessmentAgent] Failed to evaluate answer: %s", exc)
            return {
                "score": 0,
                "correct": False,
                "feedback": "Could not evaluate"
            }

    async def extract_topic(self, question: str) -> str:
        """
        Extract a short topic label from a quiz question.
        Returns a 2-4 word subject label e.g. 'Fractions', 'Algebra', 'Photosynthesis'.
        Falls back to 'General' if the LLM fails.
        """
        prompt = f"""
        What subject topic does this quiz question belong to?

        Question: {question}

        Reply with ONLY a short topic name (2-4 words max, e.g. "Fractions", "Cell Biology", "World War II").
        Do NOT include any explanation or punctuation.
        """
        try:
            result = await ai_service.generate(prompt)
            topic = result.strip().strip(".")
            # Trim to first line only in case the model added extras
            topic = topic.splitlines()[0].strip()
            logger.info("[AssessmentAgent] Extracted topic=%r from question", topic)
            return topic or "General"
        except Exception as exc:
            logger.error("[AssessmentAgent] Failed to extract topic: %s", exc)
            return "General"
