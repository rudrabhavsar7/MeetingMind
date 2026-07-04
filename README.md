# 🧠 MeetingMind

**MeetingMind** is an enterprise-grade AI meeting assistant delivered as a Chrome extension plus a web console. The extension captures live meeting audio from tools like Google Meet, streams it to the MeetingMind backend, and the console stores transcripts, summaries, action items, decisions, recordings, and RAG search across meeting history. Recording import remains available as a fallback/backfill path.

---

## 👥 The Team
* **Rudra:** Frontend Engineer (Next.js, Tailwind, shadcn/ui)
* **Jenil:** Product Manager / Full Stack (User Flows, API Integration, Auth)
* **Prashant:** Backend & AI Engineer (FastAPI, Celery, Whisper, LLMs)
* **Arnish:** DevOps & DB Engineer (Postgres, AWS, Docker, CI/CD)

---

## 🚀 Quick Start & Important Links
Before writing any code, team members should review their assigned tickets and the related architecture documents.

* **🎯 Jira Backlog & Sprint Plan:** [02-engineering/jira-tickets.md](./02-engineering/jira-tickets.md) *(Start here!)*
* **🎨 UI & Components:** [03-design/design-system.md](./03-design/design-system.md)
* **🗄️ Database Schema:** [04-backend/database-schema.md](./04-backend/database-schema.md)
* **🔌 API Specification:** [04-backend/api-specification.md](./04-backend/api-specification.md)
* **🤖 AI Pipeline:** [04-backend/ai-pipeline.md](./04-backend/ai-pipeline.md)

*(View the `documentgeneration.md` tracker to see the full list of 150+ generated design documents.)*

---

## 🛠️ Tech Stack
* **Frontend:** Chrome Extension (Manifest V3) for capture, plus Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Zustand, TanStack Query for the web console.
* **Backend:** FastAPI (Python), SQLAlchemy (Async), Pydantic.
* **AI/ML:** Whisper (Transcription), Pyannote (Diarization), OpenAI/Ollama, Celery (Background Jobs).
* **Infrastructure:** PostgreSQL + `pgvector`, Redis, Docker, AWS S3.

---

## 🤖 Using the AI Agent Workflows
This repository is configured with a `.agents` directory to supercharge your development speed.

### Global Rules
Any AI agent invoked in this workspace automatically reads `.agents/AGENTS.md` and knows our exact tech stack, coding standards, and directory structure.

### Custom Skills
You can instruct your AI to use the following custom skills:
1. **`implement-ticket`**: Tell the AI *"Use the implement-ticket skill to build MM-303"*. The AI will automatically read the Jira ticket, look up the frontend/backend design documents, and write the code exactly to spec.
2. **`doc-research`**: Tell the AI *"Use the doc-research skill to answer this from the MeetingMind docs"*. The AI will search the documented product, architecture, and implementation specs before answering.
3. **`spec-sync`**: Tell the AI *"Use the spec-sync skill to align the docs with this decision"*. The AI will find stale requirements, update the smallest needed set of docs, and keep project memory current.

---

*“The best code is the code you never wrote.”*
