import logging

from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse, summary="Send a message to the AI teacher")
async def chat(req: ChatRequest) -> ChatResponse:
    """
    Thin route — delegates entirely to chat_service (spec §4.2).

    - **user_id**: the ID of the student sending the message
    - **message**: the question or text to send to the AI teacher
    - **conversation_id**: (optional) continue an existing session; omit to start a new one
    """
    logger.info("[chat] Received request — user_id=%s", req.user_id)
    try:
        return await chat_service(req)
    except Exception as exc:
        logger.error("[chat] Service error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Service error: {exc}") from exc

