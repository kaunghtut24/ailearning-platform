````md
# 🧠 PROJECT SPECIFICATION — AI LEARNING PLATFORM

---

## 1. 🎯 PURPOSE

This document defines the **single source of truth** for all AI agents and developers.

### Goals:
- Ensure consistency across AI-generated code
- Standardize architecture and workflows
- Prevent conflicting implementations between agents
- Enable scalable multi-agent development

---

## 2. 🏗️ SYSTEM OVERVIEW

### High-Level Flow:

Frontend (Next.js)  
→ FastAPI Backend (API Layer)  
→ Service Layer  
→ Agent Layer  
→ AI Model Layer  
→ Data Layer  

---

## 3. 📁 PROJECT STRUCTURE

```bash
/backend
  /app
    /api          # FastAPI routes
    /agents       # AI agents (Instructor, Memory, etc.)
    /services     # business logic
    /models       # database models
    /schemas      # request/response schemas
    /core         # config, utils
  main.py

/frontend
  /components
  /pages
  /hooks
  /services

/docs
  PROJECT_SPEC.md
````

---

## 4. ⚙️ BACKEND RULES (FastAPI)

### 4.1 API Design

* Base path: `/api`
* Use RESTful conventions

#### Examples:

```bash
POST /api/chat
GET /api/memory
POST /api/reward
```

---

### 4.2 Endpoint Pattern (STRICT)

```python
@router.post("/chat")
async def chat(req: ChatRequest):
    return await chat_service(req)
```

### Rules:

* API layer must be **thin**
* No business logic inside routes

---

## 5. 🔌 SERVICE LAYER RULES

* All business logic must live in `/services`
* Each feature gets its own service file

### Example:

```bash
/services/chat_service.py
/services/memory_service.py
```

---

## 6. 🤖 AGENT DESIGN STANDARD

All agents MUST follow this interface:

```python
class BaseAgent:
    async def run(self, input_data: dict) -> dict:
        raise NotImplementedError
```

---

### Example Agent:

```python
class InstructorAgent(BaseAgent):
    async def run(self, input_data: dict) -> dict:
        question = input_data["question"]
        return {"response": "AI answer"}
```

---

## 7. 🔄 AGENT FLOW (STRICT)

### Execution Flow:

1. API receives request
2. API calls Service
3. Service calls Agent
4. Agent calls AI Service
5. Response returns back

---

### ❌ FORBIDDEN:

* API calling AI models directly
* Agents accessing database directly
* Agents calling API routes
* Business logic inside API

---

### ✅ REQUIRED:

* Service-based orchestration
* Agents are stateless
* Clear separation of responsibilities

---

## 8. 🧠 MEMORY SYSTEM RULES

* Memory handled via `memory_service`
* Agents receive memory as input only
* No DB access inside agents

---

## 9. 📡 API CONTRACTS

### 9.1 Chat API

#### Request:

```json
{
  "user_id": 1,
  "message": "Explain gravity"
}
```

#### Response:

```json
{
  "response": "Gravity is..."
}
```

---

## 10. 🧠 AI INTEGRATION RULE

All AI calls MUST go through:

```bash
/services/ai_service.py
```

---

### Example:

```python
async def generate_response(message: str) -> str:
    return "AI response"
```

---

## 11. 🧩 NAMING CONVENTIONS

| Type      | Convention |
| --------- | ---------- |
| Files     | snake_case |
| Classes   | PascalCase |
| Functions | snake_case |
| Variables | snake_case |
| Constants | UPPER_CASE |

---

## 12. 🧑‍💻 FRONTEND RULES (React / Next.js)

* Use functional components only
* Use React hooks
* Separate UI from API logic

---

### Example:

```javascript
const sendMessage = async (msg) => {
  await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: msg })
  });
};
```

---

## 13. 🔒 SECURITY RULES (BASIC)

* Validate all inputs using Pydantic
* Never expose raw database queries
* Use environment variables for secrets
* No hardcoded API keys

---

## 14. 🧪 TESTING RULES

* Unit test:

  * services
  * agents
* Avoid heavy UI testing initially

---

## 15. ❌ FORBIDDEN PATTERNS

* Business logic in API routes
* DB access inside agents
* Direct AI calls from API
* Mixing responsibilities across layers
* Hardcoded configs

---

## 16. ✅ REQUIRED PATTERNS

* Thin API layer
* Service-based architecture
* Agent abstraction layer
* Modular file structure
* Async-first backend

---

## 17. 🔁 DEVELOPMENT WORKFLOW

1. Define feature
2. Check PROJECT_SPEC.md
3. Generate code using AI
4. Validate against spec
5. Integrate into system
6. Test

---

## 18. 🚀 MVP SCOPE (STRICT)

ONLY BUILD:

* Chat API (`/api/chat`)
* Basic Instructor Agent
* Basic Memory Service
* Simple Chat UI

---

## 19. 📌 FUTURE EXTENSIONS (NOT NOW)

* Multi-agent orchestration
* Gamification system
* Social features
* Moderation pipeline
* Voice system

---

## 20. ⚠️ ENGINEERING PRINCIPLES

* Start simple → iterate fast
* Avoid over-engineering
* Keep agents independent
* Design for future scaling
* Maintain clean separation of concerns

---
## 21. 🎨 UI/UX SPECIFICATION (FRONTEND)

### 21.1 🎯 PURPOSE

Define UI/UX rules for building the **AI learning interface**.

Goals:
- Simple, intuitive chat experience
- Fast interaction with AI teacher
- Clean separation between UI and logic
- Easy for AI agents to generate consistent frontend code

---

## 21.2 🧩 CORE MVP UI

ONLY build:

- Chat interface
- Message input
- Message list (user + AI)

---

## 21.3 📁 FRONTEND STRUCTURE

```bash
/frontend
  /components
    ChatBox.tsx
    MessageBubble.tsx
  /services
    api.ts
  /pages
    index.tsx
````

---

## 21.4 💬 CHAT UI COMPONENT RULES

### ChatBox.tsx

Responsibilities:

* Manage message state
* Handle input
* Call backend API
* Render message list

---

### MessageBubble.tsx

Responsibilities:

* Display single message
* Different styles for:

  * user
  * AI

---

## 21.5 🔌 API INTEGRATION RULES

All API calls must go through:

```bash
/services/api.ts
```

---

### Example:

```javascript
export async function sendMessage(message) {
  return fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: 1,
      message
    })
  }).then(res => res.json());
}
```

---

## 21.6 🔄 DATA FLOW (STRICT)

UI Flow:

1. User types message
2. Message added to UI immediately
3. API request sent
4. Response received
5. AI message rendered

---

## 21.7 🎯 STATE MANAGEMENT RULES

* Use `useState` for MVP
* No global state libraries yet
* Keep state local to ChatBox

---

## 21.8 🧠 MESSAGE FORMAT

```ts
type Message = {
  role: "user" | "ai"
  content: string
}
```

---

## 21.9 ❌ FORBIDDEN UI PATTERNS

* No direct API calls inside components (except via service)
* No business logic inside UI
* No global state (Redux, Zustand) in MVP
* No over-styling or complex UI libraries

---

## 21.10 ✅ REQUIRED UI PATTERNS

* Functional components only
* Hooks-based logic
* Clear separation:

  * UI (components)
  * Logic (services)

---

## 21.11 🎨 UI DESIGN PRINCIPLES

* Minimal and clean
* Fast response feedback
* Clear distinction:

  * user messages (right)
  * AI messages (left)
* Input always accessible

---

## 21.12 🚀 MVP UI SCOPE (STRICT)

ONLY:

* Chat input
* Send button
* Message list

DO NOT BUILD:

* Auth system
* Multi-page navigation
* Complex layouts
* Animations (yet)

---

## 21.13 🔁 UI DEVELOPMENT WORKFLOW

1. Create component
2. Connect API
3. Test interaction
4. Validate against spec
5. Refactor if needed

---

# END UI/UX SPEC

```
---

# ✅ END OF SPEC

```
