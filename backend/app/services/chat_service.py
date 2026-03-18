import logging
import uuid

from app.agents.instructor_agent import InstructorAgent
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.level_service import detect_level
from app.services.memory_service import add_message, get_history, create_conversation
from app.services.ai_service import generate_title

logger = logging.getLogger(__name__)

# Single shared agent instance — stateless by design (spec §6)
_agent = InstructorAgent()


async def chat_service(req: ChatRequest) -> ChatResponse:
    """
    Orchestrates the full chat flow (spec §7):

    1. Resolve conversation ID (use provided or generate a new UUID)
    2. Fetch history from memory_service for this (user, conversation) pair
    3. Store the incoming user message
    4. Resolve student level (explicit or auto-detected)
    5. Delegate to InstructorAgent (agent calls ai_service)
    6. Store the AI response
    7. Return ChatResponse (including conversation_id so client can continue the session)
    """
    # 1. Resolve conversation — use provided ID or start a fresh session
    is_new = req.conversation_id is None
    conversation_id = req.conversation_id or str(uuid.uuid4())

    logger.info(
        "[chat_service] user_id=%s conversation_id=%s message=%r",
        req.user_id,
        conversation_id,
        req.message,
    )

    # 2. Fetch history for this specific conversation
    history = get_history(req.user_id, conversation_id)

    if is_new:
        title = await generate_title(req.message)
        create_conversation(req.user_id, conversation_id, title)

    # 3. Store user message
    add_message(req.user_id, conversation_id, "user", req.message)

    # 4. Resolve level — use explicit value if provided, otherwise auto-detect
    if req.level is None:
        level = detect_level(req.message)
        logger.info("[chat_service] level auto-detected — level=%s", level)
    else:
        level = req.level
        logger.info("[chat_service] level explicit — level=%s", level)

    # 5. Run agent — memory and level passed as data; never accessed inside agent (spec §8)
    result = await _agent.run({"message": req.message, "history": history, "level": level})

    # 6. Store AI response
    add_message(req.user_id, conversation_id, "ai", result["response"])

    logger.info(
        "[chat_service] done — user_id=%s conversation_id=%s", req.user_id, conversation_id
    )
    return ChatResponse(response=result["response"], conversation_id=conversation_id)

