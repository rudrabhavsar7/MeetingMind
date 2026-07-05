# MeetingMind Project Memory

Last reviewed: 2026-07-04

## What This Repository Is

MeetingMind is a documentation-first project for a privacy-first, self-hosted AI meeting intelligence platform. The product is now extension-first: a Chrome extension captures live meeting audio from existing meeting apps, starting with Google Meet, and the MeetingMind web console stores transcripts, summaries, action items, decisions, recordings, searchable embeddings, and cited RAG answers. Recording import and standalone web capture are secondary fallback/backfill paths.

This repo contains product, architecture, design, backend, DevOps, testing, prompt, and resource documentation. It now also contains the initial `apps/backend` FastAPI scaffold from MM-103. The `apps/frontend` and `apps/extension` implementations are still pending.

## Core Product Understanding

The core value proposition is enterprise-grade meeting intelligence without sending sensitive meeting content to third-party cloud AI services by default.

Primary workflows:

1. A user registers/logs in and belongs to a workspace.
2. The user installs/connects the MeetingMind Chrome extension.
3. The user joins a supported meeting app page, starting with Google Meet.
4. The extension detects the meeting and the user explicitly starts capture.
5. The extension streams 250-500ms tab-audio chunks over WebSocket/WebRTC and sends available source metadata.
6. The backend runs local streaming STT, online diarization, rolling LLM analysis, embedding generation, and incremental persistence.
7. Users review live/final summaries, action items, decisions, transcript segments, source app metadata, and retained recordings in the web console.
8. Users can import historical recordings or use standalone web capture as fallback paths.
9. Users search or ask questions across meetings using hybrid/vector retrieval and RAG answers with citations.

## Target Users

Primary users are engineering-led and privacy-conscious teams that need institutional meeting memory. Secondary users include regulated organizations, research teams, IT admins, and developers/integrators.

## Intended Tech Stack

Frontend:

- Chrome Extension (Manifest V3) with TypeScript for meeting capture
- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui and Radix UI
- lucide-react icons
- TanStack Query for server state
- Zustand for local state

Backend:

- FastAPI with Python 3.11 or 3.12+
- SQLAlchemy 2 async
- Pydantic v2
- Alembic migrations
- Celery workers
- Redis broker/cache/pub-sub
- PostgreSQL 16 plus pgvector
- MinIO or S3-compatible object storage
- FFmpeg
- Whisper/faster-whisper or local streaming STT
- pyannote.audio for speaker diarization
- Ollama for local LLM inference
- BAAI BGE or similar embeddings

Infrastructure:

- Docker Compose for v1 self-hosted deployments
- Nginx reverse proxy in production
- Optional GPU worker routing for transcription/diarization
- Local observability with logs, Prometheus/Grafana, and Celery Flower where applicable

## Planned Monorepo Shape

The docs describe this target structure:

```text
apps/
  extension/
  frontend/
  backend/
docker-compose.yml
```

`apps/backend` now exists as the initial FastAPI scaffold. `apps/extension` is the planned Chrome extension capture client. `apps/frontend` is the planned MeetingMind web console.

Frontend should use feature-sliced Next.js conventions, colocating route-only components under route `_components` folders and using shared components only when reuse is real.

Backend should use layered architecture:

- `app/api` for HTTP routing and FastAPI dependencies only
- `app/services` for business logic
- `app/models` for SQLAlchemy models
- `app/schemas` for Pydantic schemas
- `app/tasks` for Celery task entry points
- `app/ai` for Whisper, diarization, summarization, embedding, and RAG logic

## Core Data Model

Main entities:

- `Workspace`
- `User`
- `WorkspaceMembership`
- `Meeting`
- `TranscriptSegment`
- `ActionItem`
- `Decision`

Important rules:

- Use UUID primary keys.
- Every tenant-scoped entity belongs to a workspace.
- Protect all workspace data through membership checks and preferably PostgreSQL RLS later.
- Store transcripts as timestamped segments, not one large blob.
- Store vectors in pgvector with HNSW indexes.
- Use soft deletes for valuable entities like meetings and workspaces.

## API Shape

Base URL: `/api/v1`

Important endpoint groups:

- `/auth` for login, refresh, current user
- `/workspaces`
- `/workspaces/{workspace_id}/meetings`
- `/meetings/{meeting_id}/transcript`
- `/meetings/{meeting_id}/action-items`
- `/meetings/{meeting_id}/decisions`
- `/workspaces/{workspace_id}/ai/chat`
- Extension auth/connect endpoints
- WebSockets for extension live audio streaming and processing status
- SSE for streaming RAG responses where appropriate

Response formats should be consistent JSON envelopes for success and standardized structured errors for failures.

## AI Pipeline

The docs describe two processing modes:

1. Chrome extension real-time streaming pipeline via WebSockets/WebRTC for live tab audio.
2. Standalone web live capture fallback using the same stream API.
3. Batch pipeline via Celery for imported recordings and backfills.

Real-time stages:

1. Detect supported meeting app tab in the Chrome extension.
2. Create live meeting session and stream tab-audio chunks.
3. Sync source app, URL, visible title, and visible participants where available.
4. Normalize chunks and pass them to local streaming STT.
5. Emit interim transcript events to the extension side panel and console.
6. Persist final speaker-labeled transcript segments.
7. Run rolling summary/action/decision extraction through local LLMs.
8. Generate embeddings for finalized transcript chunks.
9. Publish status and AI events to the UI.

Batch import stages:

1. Extract and normalize audio with FFmpeg.
2. Transcribe with Whisper and diarize with pyannote.
3. Merge transcript words/segments with speaker labels.
4. Generate summary, action items, decisions, and topics through local LLMs.
5. Chunk and embed transcript text.
6. Store vectors in pgvector.
7. Emit completion events and clean temporary files.

The product philosophy requires every AI output to be auditable with citations back to source transcript segments.

## Design Direction

MeetingMind should feel professional, calm, secure, and information-dense. It is an enterprise productivity tool, not a marketing-heavy or playful app.

Design system requirements:

- Tailwind CSS variables for theming
- Light, dark, and system theme support
- Emerald primary accent
- Slate/zinc neutral backgrounds
- Outfit font
- Radix/shadcn primitives
- WCAG 2.2 AA accessibility baseline
- lucide-react icons
- Avoid hardcoded colors when semantic tokens exist

## Testing Strategy

Expected testing stack:

- Backend unit/integration: pytest
- Frontend unit/component: Vitest
- E2E: Playwright
- AI calls mocked in standard CI
- Separate evaluation suite for real LLM quality checks

Coverage targets are roughly 80 percent or higher for business logic, with AI providers mocked in normal deterministic tests.

## Backlog Priorities

The current detailed Jira document organizes work into these modules:

- MM-100: project foundation and DevOps
- MM-200: database and authentication
- MM-300: Chrome extension capture and storage
- MM-400: AI pipeline
- MM-500: core application UI
- MM-600: RAG search and Ask AI

When implementing a ticket, read `02-engineering/jira-tickets.md` first, then `02-engineering/jira-task-breakdown.md`, then read the matching product, backend, design, and testing docs before editing code.

## Important Local Agent Rules

The repo has a generic AI-agent operating layer:

- `AGENTS.md` is the universal entrypoint for any AI tool.
- `.agents/context-map.md` tells agents which docs to read for each task type.
- `.agents/commands.md` defines tool-neutral command workflows.
- `.agents/workflows/` stores reusable implementation, review, spec-sync, memory, and handoff playbooks.
- `.cursorrules`, `GEMINI.md`, and `.github/copilot-instructions.md` adapt the same rules for common tools without making the project Claude-specific.

Agents must consult relevant documentation before implementing features.

Available local skills:

- `implement-ticket`: intended for building a specific Jira ticket like `MM-303`.
- `doc-research`: intended for documentation-grounded project questions.
- `spec-sync`: intended for resolving documentation drift and updating memory.

## Notable Documentation Notes For Implementation

These points are resolved product/architecture direction and should guide future work:

- Default AI stance is local-only via Ollama. External providers are opt-in only unless a ticket explicitly says otherwise.
- Real-time capture has been resolved as the primary v1 ingestion mode in ADR 006.
- Chrome extension capture has been resolved as the primary v1 capture surface in ADR 007. Google Meet is first; Zoom Web and Teams Web are fast-follow; desktop and mobile capture are later integration tracks.

Future implementation should follow these decisions unless a newer ADR or user decision changes them.

## Current Repository State Observed

Root is mostly markdown documentation plus the initial backend scaffold. Key folders:

- `00-project`: vision, roadmap, architecture, glossary, metrics
- `01-product`: PRD, TRD, requirements, personas, journeys, acceptance criteria
- `02-engineering`: standards, auth, API design, folder structure, Jira tickets
- `03-design`: design system, pages, components, tokens, accessibility
- `04-backend`: API spec, DB schema, AI pipeline, RAG, storage, auth flow, tests
- `05-devops`: Docker, CI/CD, infrastructure, environments, secrets
- `06-testing`: test strategy, QA checklists, unit/integration/e2e/security/performance
- `07-prompts`: agent and assistant prompt/rule docs
- `08-resources`: templates, references, release notes, decision log
- `apps/backend`: FastAPI backend scaffold with Poetry, app factory, health routes, settings, logging, and starter tests

Uncommitted changes were present during review in several docs, including:

- `README.md`
- `00-project/product-overview.md`
- `00-project/roadmap.md`
- `00-project/vision.md`
- `01-product/prd.md`
- `04-backend/ai-pipeline.md`
- `04-backend/api-specification.md`
- `04-backend/transcription.md`
- `02-engineering/jira-tickets.md`
- `.agents/`

Do not revert these unless explicitly asked.
