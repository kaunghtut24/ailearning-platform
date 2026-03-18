from pydantic import BaseModel
from typing import List
from datetime import datetime

class Conversation(BaseModel):
    id: str
    user_id: int
    title: str
    created_at: datetime

class Message(BaseModel):
    id: int
    conversation_id: str
    role: str
    content: str
    created_at: datetime
