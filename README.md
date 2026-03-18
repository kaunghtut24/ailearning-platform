# 🎓 AI Learning Platform

A full-stack AI-powered chat platform where an intelligent teacher adapts its explanations to each student's level — primary, middle, or secondary school.

---

## ✨ Features

- **Adaptive AI Teacher** — responses tailored to the student's level (primary / middle / secondary)
- **Auto Level Detection** — if no level is provided, the system infers it from vocabulary and message length
- **Conversation Memory** — per-user chat history is kept in-session for contextual, multi-turn responses
- **Streaming UI** — AI responses appear word-by-word with a typing animation (simulated on the frontend)
- **Level Selector** — users can manually switch difficulty at any time from the chat header

---

## 🛠 Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Backend   | FastAPI, Python 3.12, Pydantic v2               |
| AI Model  | Google Gemini (`google-generativeai`)           |
| Server    | Uvicorn (ASGI)                                  |

---

## 📁 Project Structure

```
ailearning-platform/
├── backend/
│   ├── app/
│   │   ├── api/                   # FastAPI route handlers (thin layer)
│   │   │   └── chat.py
│   │   ├── agents/                # Stateless AI agents
│   │   │   └── instructor_agent.py
│   │   ├── services/              # All business logic lives here
│   │   │   ├── ai_service.py      # Gemini API calls
│   │   │   ├── chat_service.py    # Orchestrates level + memory + agent
│   │   │   ├── level_service.py   # Auto-detects student level
│   │   │   └── memory_service.py  # In-memory conversation history
│   │   ├── schemas/               # Pydantic request / response models
│   │   │   └── chat.py
│   │   ├── prompts/               # Level-specific system prompt files
│   │   └── core/                  # Config & environment helpers
│   └── requirements.txt
│
├── frontend/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   └── ChatBox.tsx            # Chat UI with streaming animation
│   └── lib/
│       └── api.ts                 # sendMessage() typed API client
│
└── PROJECT_SPECIFICATION-AILEARNING.md
```

---

## ⚙️ Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

---

### Backend

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Open .env and set your key:
# GEMINI_API_KEY=your_key_here
```

---

### Frontend

```bash
cd frontend
npm install
```

---

## 🚀 Running Locally

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd backend
uvicorn app.main:app --port 8000 --reload
```

**Terminal 2 — Frontend**
```bash
cd frontend

# Windows (bypasses any globally installed Next.js)
.\node_modules\.bin\next dev

# macOS / Linux
npx next dev
```

Then open **http://localhost:3000** in your browser.

---

## 🌐 API Reference

### `POST /api/chat`

Send a message and receive an AI teacher response.

**Request body**
```json
{
  "user_id": 1,
  "message": "Explain gravity",
  "level": "primary"
}
```

> `level` is optional. Omit it to let the system auto-detect from the message content.  
> Accepted values: `"primary"` · `"middle"` · `"secondary"`

**Response**
```json
{
  "response": "Gravity is a force that pulls things towards each other..."
}
```

**cURL example**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "message": "What is photosynthesis?", "level": "middle"}'
```

---

### `GET /health`

```bash
curl http://localhost:8000/health
# → {"status": "ok"}
```

---

## 🏗 Architecture

```
User Input
    │
    ▼
Next.js ChatBox (React 19)
    │  POST /api/chat
    ▼
FastAPI  ──► chat_service ──► level_service  (auto-detect level)
                          ──► memory_service (fetch/store history)
                          ──► InstructorAgent
                                    │
                                    ▼
                              ai_service  (Gemini API)
                                    │
                                    ▼
                           ChatResponse (JSON)
    │
    ▼
Frontend streams response word-by-word via setInterval
```

---

## 📄 License

MIT

