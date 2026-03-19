from typing import Literal, Optional

from pydantic import BaseModel, Field

StudentLevel = Literal["primary", "middle", "secondary"]


class ChatRequest(BaseModel):
    user_id: int = Field(..., description="Unique identifier for the user")
    message: str = Field(..., min_length=1, description="The user's message to the AI teacher")
    level: Optional[StudentLevel] = Field(
        default=None,
        description=(
            "Student level — 'primary' (ages 6–11), 'middle' (11–14), 'secondary' (14–18). "
            "Omit to let the system auto-detect from the message."
        ),
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description=(
            "Conversation session ID. Pass the value returned by the previous response "
            "to continue an existing conversation. Omit to start a new one."
        ),
    )


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI teacher's response")
    conversation_id: str = Field(
        ..., description="Conversation session ID — echo back in subsequent requests"
    )
    quiz: Optional[dict] = Field(default=None, description="Assessment quiz if generated")

