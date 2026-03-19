import logging
import uuid
import app.services.memory_service as memory_service
import app.services.level_service as level_service
from app.agents.instructor_agent import InstructorAgent
from app.orchestrator.agent_orchestrator import AgentOrchestrator
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

# Single shared instructor agent
_instructor_agent = InstructorAgent()

async def chat_service(req: ChatRequest) -> ChatResponse:
    """Delegates orchestration to the AgentOrchestrator (user-requested refactoring)."""
    
    # Initialize the orchestrator
    _orchestrator = AgentOrchestrator(memory_service, level_service, _instructor_agent)
    
    # Resolve conversation_id
    conversation_id = req.conversation_id or str(uuid.uuid4())
    
    # Process the message
    result = await _orchestrator.process_message(req.user_id, req.message, req.level, conversation_id)
    
    # Return ChatResponse
    return ChatResponse(response=result["answer"], conversation_id=conversation_id)

