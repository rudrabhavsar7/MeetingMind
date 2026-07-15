---
Title: MeetingMind — Resources: External References
Version: 1.1.0
Status: Approved
Owner: Lead Architect
Last Updated: 2026-07-10
Dependencies: None
---

# MeetingMind Resources: External References

## 1. Overview
This document catalogs all external documentation, libraries, SDKs, and research papers referenced while building the MeetingMind architecture.

## 2. Frontend Dependencies

### 2.1 Core Framework
* **Next.js 15 (App Router):** [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
* **React 18+:** [https://react.dev/reference/react](https://react.dev/reference/react)
* **Tailwind CSS v3:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
* **TypeScript:** [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)

### 2.2 UI & Data Fetching
* **shadcn/ui:** [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)
* **Radix UI Primitives:** [https://www.radix-ui.com/primitives/docs/overview/introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
* **Lucide Icons:** [https://lucide.dev/icons/](https://lucide.dev/icons/)
* **TanStack Query (React Query) v5:** [https://tanstack.com/query/latest/docs/react/overview](https://tanstack.com/query/latest/docs/react/overview)
* **Zustand (State Management):** [https://docs.pmnd.rs/zustand/getting-started/introduction](https://docs.pmnd.rs/zustand/getting-started/introduction)
* **TanStack Virtual (for large transcripts):** [https://tanstack.com/virtual/latest](https://tanstack.com/virtual/latest)

### 2.3 Chrome Extension Capture
* **Chrome `tabCapture` API:** [https://developer.chrome.com/docs/extensions/reference/api/tabCapture](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
* **Chrome Offscreen API:** [https://developer.chrome.com/docs/extensions/reference/api/offscreen](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
* **Chrome Audio Recording and Screen Capture Guide:** [https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture)

## 3. Backend Dependencies

### 3.1 Core API & Task Queue
* **FastAPI:** [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
* **Pydantic v2:** [https://docs.pydantic.dev/latest/](https://docs.pydantic.dev/latest/)
* **SQLAlchemy 2.0 (Async):** [https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
* **Celery:** [https://docs.celeryq.dev/en/stable/](https://docs.celeryq.dev/en/stable/)
* **Alembic (Migrations):** [https://alembic.sqlalchemy.org/en/latest/](https://alembic.sqlalchemy.org/en/latest/)

### 3.2 Database
* **PostgreSQL 16:** [https://www.postgresql.org/docs/16/index.html](https://www.postgresql.org/docs/16/index.html)
* **pgvector:** [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
* **Redis:** [https://redis.io/docs/](https://redis.io/docs/)

## 4. AI & Machine Learning

### 4.1 Speech Processing
* **OpenAI Whisper:** [https://github.com/openai/whisper](https://github.com/openai/whisper)
* **Faster-Whisper (CTranslate2):** [https://github.com/SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)
* **Pyannote.audio (Diarization):** [https://github.com/pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio)
* **FFmpeg:** [https://ffmpeg.org/documentation.html](https://ffmpeg.org/documentation.html)

### 4.2 Large Language Models
* **OpenAI API Docs (GPT-4o, Embeddings):** [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
* **Anthropic API Docs (Claude 3.5 Sonnet):** [https://docs.anthropic.com/claude/reference/getting-started-with-the-api](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
* **Ollama (Local LLMs):** [https://github.com/ollama/ollama](https://github.com/ollama/ollama)

## 5. DevOps & Infrastructure
* **Docker:** [https://docs.docker.com/](https://docs.docker.com/)
* **GitHub Actions:** [https://docs.github.com/en/actions](https://docs.github.com/en/actions)
* **AWS ECS Fargate:** [https://docs.aws.amazon.com/ecs/](https://docs.aws.amazon.com/ecs/)
* **AWS S3 (Presigned URLs):** [https://boto3.amazonaws.com/v1/documentation/api/latest/guide/s3-presigned-urls.html](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/s3-presigned-urls.html)

## 6. Testing
* **Playwright (E2E):** [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro)
* **Vitest (Frontend Unit):** [https://vitest.dev/guide/](https://vitest.dev/guide/)
* **pytest (Backend Unit/Integration):** [https://docs.pytest.org/en/7.4.x/](https://docs.pytest.org/en/7.4.x/)
