# MeetingMind Copilot Instructions

Follow the repository-wide agent guide in `AGENTS.md`.

Key rules:

- Read relevant docs before suggesting implementation.
- Frontend uses Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, shadcn/ui, Radix UI, and lucide-react.
- Backend uses FastAPI, Pydantic v2, async SQLAlchemy, Celery, Redis, PostgreSQL plus pgvector, and MinIO/S3-compatible storage.
- Do not introduce `any` types.
- Do not hardcode secrets.
- Default AI processing to local/self-hosted providers unless explicitly configured otherwise.
- Respect workspace-level authorization and data isolation.

