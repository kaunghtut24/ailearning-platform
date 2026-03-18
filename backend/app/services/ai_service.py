import asyncio
import logging
from pathlib import Path

import google.generativeai as genai

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load one prompt file per level at startup; build a dedicated model for each
# ---------------------------------------------------------------------------
_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

_LEVEL_FILES: dict[str, str] = {
    "primary":   "instructor_primary.txt",
    "middle":    "instructor_middle.txt",
    "secondary": "instructor_secondary.txt",
}

DEFAULT_LEVEL = "primary"

genai.configure(api_key=GEMINI_API_KEY)

# Pre-load prompts and instantiate one GenerativeModel per level
_models: dict[str, genai.GenerativeModel] = {}
for _level, _filename in _LEVEL_FILES.items():
    try:
        _prompt = (_PROMPTS_DIR / _filename).read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        raise RuntimeError(
            f"[ai_service] Missing prompt file: {_filename} "
            f"(expected at {_PROMPTS_DIR / _filename})"
        ) from None
    _models[_level] = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=_prompt,
    )
    logger.info("[ai_service] Loaded prompt — level=%s file=%s", _level, _filename)


def build_prompt(history: list[str], message: str) -> str:
    """
    Combine prior conversation turns with the new user message.

    Format:
        [history turn 0]
        ...
        User: <message>
    """
    prior = "\n".join(history)
    return f"{prior}\nUser: {message}" if prior else f"User: {message}"


async def generate_response(
    message: str,
    history: list[str] | None = None,
    level: str = DEFAULT_LEVEL,
) -> str:
    """
    Select the prompt for the given student level, combine with history +
    user message, send to Gemini, and return the reply.

    Prompt structure:
        [system_instruction]  ← instructor_<level>.txt (on the model object)
        [history turn 0]
        ...
        User: <message>

    history : previous turns oldest-first, each labelled "User:" or "AI:".
    level   : "primary" | "middle" | "secondary" — defaults to "primary".

    Falls back to a mock response when GEMINI_API_KEY is not set.
    """
    # Resolve level to a known key; guard against unexpected values
    resolved_level = level if level in _models else DEFAULT_LEVEL
    prompt_file = _LEVEL_FILES[resolved_level]

    if not GEMINI_API_KEY:
        logger.warning("[ai_service] GEMINI_API_KEY not set — returning mock response")
        await asyncio.sleep(0)  # keep the function truly async
        return (
            f"[MOCK] AI Teacher (level={resolved_level}) received: '{message}'. "
            "Set GEMINI_API_KEY in your .env file to enable real responses."
        )

    # Combine history turns + new user message into the conversation body
    history = history or []
    prompt = build_prompt(history, message)

    logger.info(
        "[ai_service] Calling Gemini — model=%s level=%s prompt_file=%s history_turns=%d",
        GEMINI_MODEL,
        resolved_level,
        prompt_file,
        len(history),
    )
    model = _models[resolved_level]
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(
        None,
        lambda: model.generate_content(prompt),
    )
    logger.info("[ai_service] Gemini response received")
    return response.text

