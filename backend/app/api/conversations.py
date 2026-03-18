import logging
from fastapi import APIRouter
from pydantic import BaseModel
import uuid
from typing import List

from app.services.memory_service import (
    get_conversations, get_messages, create_conversation,
    update_conversation_title, delete_conversation
)

logger = logging.getLogger(__name__)
router = APIRouter()

class CreateConvReq(BaseModel):
    user_id: int
    title: str

class UpdateConvReq(BaseModel):
    title: str

@router.get("/conversations")
async def list_conversations(user_id: int):
    return get_conversations(user_id)

@router.post("/conversations")
async def add_conversation(req: CreateConvReq):
    conv_id = str(uuid.uuid4())
    create_conversation(req.user_id, conv_id, req.title)
    return {"id": conv_id, "user_id": req.user_id, "title": req.title}

@router.patch("/conversations/{conversation_id}")
async def rename_conversation(conversation_id: str, req: UpdateConvReq):
    update_conversation_title(conversation_id, req.title)
    return {"status": "ok", "id": conversation_id, "title": req.title}

@router.delete("/conversations/{conversation_id}")
async def remove_conversation(conversation_id: str):
    delete_conversation(conversation_id)
    return {"status": "ok", "id": conversation_id}

@router.get("/messages")
async def fetch_messages(conversation_id: str):
    return get_messages(conversation_id)
