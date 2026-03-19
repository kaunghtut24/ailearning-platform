import logging

# Configure logging FIRST — before any app imports so module-level
# log lines (e.g. "Loaded system prompt") are captured immediately.
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(name)s | %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.api.chat import router as chat_router
from app.api.conversations import router as conv_router
from app.api.evaluate import router as eval_router
from app.api.stats import router as stats_router

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
# Init Database and include routers
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(chat_router, prefix="/api")
app.include_router(conv_router, prefix="/api")
app.include_router(eval_router, prefix="/api")
app.include_router(stats_router, prefix="/api")

@app.get("/health", tags=["health"])
async def health() -> dict:
    """Quick liveness check."""
    return {"status": "ok"}

