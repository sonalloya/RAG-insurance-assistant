# 🛡️ RAG Insurance AI Assistant — Full-Stack Project

AI-powered insurance policy chatbot using Retrieval-Augmented Generation (RAG).
**Frontend → Vercel | Backend → Render | Database → Supabase**

---

## 📁 Project Structure

```
insurance-ai-project/
├── frontend/               ← Deploy to Vercel
│   ├── index.html
│   ├── admin.html
│   ├── features.html
│   ├── style.css
│   ├── script.js           ← API calls wired (API_URL config inside)
│   └── vercel.json
│
├── backend/                ← Deploy to Render
│   ├── server.js           ← Express app entry point
│   ├── package.json
│   ├── .env.example        ← Copy to .env and fill in
│   ├── routes/
│   │   ├── chat.js         ← POST /ask, GET /chats
│   │   └── policy.js       ← POST /upload, GET /policies
│   ├── controllers/
│   │   ├── chatController.js
│   │   └── policyController.js
│   └── utils/
│       └── supabase.js     ← Supabase client
│
└── supabase_schema.sql     ← Run in Supabase SQL Editor
```

---

## ⚡ Quick Start — Local Development

### 1. Set up Supabase database

1. Go to [supabase.com](https://supabase.com) → create a project
2. Open **SQL Editor** → **New Query**
3. Paste and run the contents of `supabase_schema.sql`
4. Go to **Project Settings → API** → copy your `URL` and `anon public` key

### 2. Run the backend locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and fill in SUPABASE_URL and SUPABASE_ANON_KEY
npm run dev
```

Backend will start at: `http://localhost:5000`

**Test it:**
```bash
# Health check
curl http://localhost:5000/

# Ask a question
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What is covered under hospitalization?\"}"
```

### 3. Open the frontend

Open `frontend/index.html` in your browser (or use VS Code Live Server).

The `window.ENV_API_URL` in each HTML file is set to `http://localhost:5000` for local dev.

---

## 🚀 Deployment

### Step 1 — Deploy Backend to Render

1. Push `insurance-ai-project/backend/` to a **GitHub repo**
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add environment variables:
   - `SUPABASE_URL` → your Supabase project URL
   - `SUPABASE_ANON_KEY` → your Supabase anon key
   - `FRONTEND_URL` → your Vercel URL (add after Vercel deploy)
6. Click **Deploy** — Render will give you a URL like `https://your-app.onrender.com`

### Step 2 — Update API URL in Frontend

In each of `frontend/index.html`, `frontend/admin.html`, `frontend/features.html`, find:

```html
<script>
  window.ENV_API_URL = "http://localhost:5000";
</script>
```

Change to your Render URL:

```html
<script>
  window.ENV_API_URL = "https://your-app.onrender.com";
</script>
```

### Step 3 — Deploy Frontend to Vercel

1. Push `insurance-ai-project/frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Configure:
   - **Framework:** Other
   - **Root Directory:** `frontend`
4. Click **Deploy** — Vercel gives you `https://your-project.vercel.app`
5. Go back to Render → add `FRONTEND_URL=https://your-project.vercel.app` to env vars

---

## 🗄️ Supabase Schema

| Table | Columns |
|-------|---------|
| `policies` | `id` (uuid), `name` (text), `file_url` (text), `created_at` (timestamptz) |
| `chats` | `id` (uuid), `question` (text), `answer` (text), `created_at` (timestamptz) |

---

## 🔌 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Health check — returns server status |
| `POST` | `/ask` | Send a question, get AI answer (saved to Supabase) |
| `GET` | `/chats` | Get recent chat history from Supabase |
| `POST` | `/upload` | Upload a policy file (metadata saved to Supabase) |
| `GET` | `/policies` | List all indexed policies |

### POST /ask

**Request:**
```json
{ "question": "What is covered under hospitalization?" }
```

**Response:**
```json
{
  "question": "What is covered under hospitalization?",
  "answer": "Based on Section 4.2 – Hospitalization Coverage...",
  "source": "simulated-rag",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🤖 How It Works

```
USER → Frontend (Vercel)
         │
         │  POST /ask {question}
         ▼
      Backend (Render / Express)
         │
         ├── chatController.generateAIResponse()   ← Simulated AI now
         │        (Replace with OpenAI / LangChain + RAG later)
         │
         ├── supabase.from('chats').insert(...)     ← Log to DB
         │
         └── Returns {answer}
         │
         ▼
      Supabase (PostgreSQL)
      └── chats table (question, answer, timestamp)
      └── policies table (name, file_url, timestamp)
```

### How to add real AI / RAG later

In `backend/controllers/chatController.js`, replace the `generateAIResponse()` function with:

```js
// Example: OpenAI GPT-4
const { OpenAI } = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAIResponse(question) {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an insurance policy assistant. Answer based on the policy documents provided.' },
      { role: 'user', content: question }
    ]
  });
  return completion.choices[0].message.content;
}
```

For full RAG (Retrieval-Augmented Generation), add:
1. **LangChain** or **LlamaIndex** for document chunking and retrieval
2. **pgvector** Supabase extension for vector embeddings
3. Upload policy PDFs → chunk → embed → store in `documents` table with embeddings
4. On each `/ask` request: embed question → similarity search → inject top chunks into LLM prompt

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML + CSS + JS |
| Frontend Hosting | Vercel |
| Backend | Node.js + Express |
| Backend Hosting | Render |
| Database | Supabase (PostgreSQL) |
| File Uploads | Multer |
| CORS | cors npm package |
| Environment | dotenv |
