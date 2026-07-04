# MeetingMind Global Agent Rules

This file is kept for agents that explicitly read `.agents/AGENTS.md`.

The canonical, tool-agnostic agent guide is now:

- `AGENTS.md`
- `PROJECT_MEMORY.md`
- `.agents/context-map.md`
- `.agents/commands.md`
- `.agents/workflows/`

## Required Behavior

1. Read `PROJECT_MEMORY.md` and root `AGENTS.md` before meaningful work.
2. Use `.agents/context-map.md` to choose task-specific docs.
3. Do not implement before reading the relevant acceptance criteria and specifications.
4. Keep changes scoped.
5. Preserve the privacy-first, self-hosted product stance.

## Stack Snapshot

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI, lucide-react, TanStack Query, Zustand.
- Backend: FastAPI, Pydantic v2, async SQLAlchemy, Alembic, Celery, Redis, PostgreSQL plus pgvector, MinIO/S3.
- AI: Whisper/faster-whisper, pyannote.audio, Ollama, local embeddings by default.

## Non-Negotiables

- No hardcoded secrets.
- No TypeScript `any`.
- Python must be typed.
- Default to Server Components.
- Use local AI providers by default.
- Enforce workspace-level data isolation.
