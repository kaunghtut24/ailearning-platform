import logging

# Configure logging FIRST — before any app imports so module-level
# log lines (e.g. "Loaded system prompt") are captured immediately.
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(name)s | %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router

app = FastAPI(
    title="AI Learning Platform — Teacher Chat API",
    description="MVP backend: send a message, get an AI teacher response powered by Gemini.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — open for local development; tighten before production
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(chat_router, prefix="/api")


@app.get("/health", tags=["health"])
async def health() -> dict:
    """Quick liveness check."""
    return {"status": "ok"}

