import json
import logging
import app.services.ai_service as ai_service

logger = logging.getLogger(__name__)

class AssessmentAgent:
    """Agent responsible for generating short quiz questions to assess student understanding."""

    async def generate_quiz(self, topic: str, level: str, insights: dict) -> dict:
        """Generate ONE short quiz question based on topic, level, and student insights."""
        
        prompt = f"""
        Generate ONE short quiz question.

        Topic: {topic}
        Level: {level}

        Student struggles with:
        {insights.get("topics_struggling", [])}

        Rules:
        - Simple
        - Clear
        - One question only

        Return ONLY the question text.
        """

        try:
            logger.info("[AssessmentAgent] Generating quiz for topic=%s, level=%s", topic, level)
            question = await ai_service.generate(prompt)
            return {
                "question": question.strip()
            }
        except Exception as exc:
            logger.error("[AssessmentAgent] Failed to generate quiz: %s", exc)
            return {
                "question": "Could you explain what we just talked about in your own words?"
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
