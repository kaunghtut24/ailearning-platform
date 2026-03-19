from fastapi import APIRouter
from app.services.stats_service import get_user_stats

router = APIRouter()

@router.get("/stats/{user_id}")
async def fetch_user_stats(user_id: int):
    return get_user_stats(user_id)
