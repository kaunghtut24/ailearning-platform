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

# Log startup mode so it is immediately visible in the server console
if GEMINI_API_KEY:
    logger.info(
        "[ai_service] REAL MODE — Gemini API key present, model=%s", GEMINI_MODEL
    )
else:
    logger.warning(
        "[ai_service] MOCK MODE — GEMINI_API_KEY not set; "
        "add it to backend/.env to enable real responses"
    )


def build_prompt(history: list[str], message: str, profile: str = "") -> str:
    """
    Combine prior conversation turns with the new user message.

    Format:
        [history turn 0]
        ...
        User: <message>
    """
    prior = "\n".join(history)
    profile_ctx = f"Student profile: {profile}\n\n" if profile else ""
    return f"{profile_ctx}{prior}\nUser: {message}" if prior else f"{profile_ctx}User: {message}"


async def generate_response(
    message: str,
    history: list[str] | None = None,
    level: str = DEFAULT_LEVEL,
    profile: str = "",
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
    prompt = build_prompt(history, message, profile)

    logger.info(
        "[ai_service] Calling Gemini — model=%s level=%s prompt_file=%s history_turns=%d",
        GEMINI_MODEL,
        resolved_level,
        prompt_file,
        len(history),
    )
    model = _models[resolved_level]
    loop = asyncio.get_running_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt),
        )
        logger.info("[ai_service] Gemini response received")
        return response.text
    except Exception as exc:
        logger.error(
            "[ai_service] Gemini call failed — %s: %s", type(exc).__name__, exc
        )
        return (
            "I'm having trouble reaching the AI service right now. "
            "Please try again in a moment."
        )

async def generate_title(message: str) -> str:
    """
    Generate a short summary title for a new conversation based on the first message.
    """
    fallback_title = message[:50]
    if not GEMINI_API_KEY:
        return fallback_title

    prompt = f"Summarize this question into a short title (max 5 words): {message}"
    model = genai.GenerativeModel(model_name=GEMINI_MODEL)
    loop = asyncio.get_running_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt),
        )
        title = response.text.strip().replace('"', '')
        return title if title else fallback_title
    except Exception as exc:
        logger.error("[ai_service] generate_title failed: %s", exc)
        return fallback_title

async def generate(prompt: str) -> str:
    """General purpose LLM call (user-requested)."""
    if not GEMINI_API_KEY:
        return ""
    
    model = genai.GenerativeModel(model_name=GEMINI_MODEL)
    loop = asyncio.get_running_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt),
        )
        return response.text
    except Exception as exc:
        logger.error("[ai_service] generate failed: %s", exc)
        return ""
