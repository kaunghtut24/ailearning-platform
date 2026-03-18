from pydantic import BaseModel
from typing import List

class StudentProfile(BaseModel):
    user_id: int
    strengths: List[str]
    weaknesses: List[str]
    topics_learned: List[str]
