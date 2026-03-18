from typing import Literal

from pydantic import BaseModel, Field

StudentLevel = Literal["primary", "middle", "secondary"]


class ChatRequest(BaseModel):
    user_id: int = Field(..., description="Unique identifier for the user")
    message: str = Field(..., min_length=1, description="The user's message to the AI teacher")
    level: StudentLevel = Field(
        default="primary",
        description="Student level — 'primary' (ages 6–11), 'middle' (11–14), 'secondary' (14–18)",
    )


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI teacher's response")

