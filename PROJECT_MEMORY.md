# MeetingMind Project Memory

Last reviewed: 2026-07-15

## What This Repository Is

MeetingMind is a documentation-first project for a privacy-first, self-hosted AI meeting intelligence platform. The product is now extension-first: a Chrome extension captures live meeting audio from existing meeting apps, starting with Google Meet, and the MeetingMind web console stores transcripts, summaries, action items, decisions, recordings, searchable embeddings, and cited RAG answers. Recording import and standalone web capture are secondary fallback/backfill paths.

This repo contains product, architecture, design, backend, DevOps, testing, prompt, and resource documentation. It now also contains initial `apps/backend`, `apps/frontend`, and `apps/extension` scaffolds. The implementation is still early and should be checked against the docs before assuming any feature is complete.

## Core Product Understanding

The core value proposition is enterprise-grade meeting intelligence without sending sensitive meeting content to third-party cloud AI services by default.

Primary workflows:

1. On a fresh v1 deployment, the first operator bootstraps the initial Owner and one default workspace; later users register only through workspace invitations and then log in normally.
2. The user installs/connects the MeetingMind Chrome extension.
3. The user joins a supported meeting app page, starting with Google Meet.
4. The extension detects the meeting and the user explicitly starts capture.
5. The extension streams self-framed 250-500ms PCM tab-audio chunks over the v1 WebSocket protocol and sends available source metadata.
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
- Shared development and staging use only Supabase-managed PostgreSQL/pgvector: separate `meetingmind_dev` and `meetingmind_staging` schemas and roles; all other services remain local/self-hosted

## Planned Monorepo Shape

The docs describe this target structure:

```text
apps/
  extension/
  frontend/
  backend/
docker-compose.yml
```

`apps/backend` exists as the initial FastAPI scaffold. `apps/frontend` exists as the early MeetingMind web console scaffold. `apps/extension` exists as the early Chrome extension scaffold.

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
- `WorkspaceInvitation`
- `PasswordResetToken`
- `RefreshToken`
- `ExtensionSession`
- `Meeting`
- `MeetingParticipant`
- `MediaObject`
- `TranscriptSegment`
- `TranscriptChunk`
- `AIProcessingRun`
- `SummaryVersion`
- `ActionItem`
- `Decision`
- `AIOutputCitation`
- `AIOutputFeedback`
- `AuditLog`

Important rules:

- Use UUID primary keys.
- Every tenant-scoped entity belongs to a workspace.
- Protect all workspace data through membership checks and preferably PostgreSQL RLS later.
- Store transcripts as timestamped segments, not one large blob.
- Store vectors in pgvector with HNSW indexes.
- `04-backend/data-dictionary.md` is canonical: every tenant table has direct `workspace_id`; transcript source segments are immutable and embedding-free; local BGE vectors live on versioned `TranscriptChunk` rows.
- AI summaries are immutable versions, regeneration is append-only, and AI processing runs record provider/model/prompt/input lineage.
- AI-origin summaries, actions, and decisions require exact same-meeting transcript citations before becoming current/user-visible.
- Use soft deletes for valuable entities like meetings and workspaces.
- v1 exposes one active default workspace per deployment while retaining workspace-scoped storage and authorization for future multi-workspace support.
- Workspace roles are `owner`, `admin`, `member`, and `viewer`; only Owner can grant/remove Owner, and the last Owner is protected.
- Invitation and password-reset tokens are single-use, expiring, revocable, and stored only as hashes.
- `01-product/requirements-traceability.md` maps every approved v1 functional requirement to its Jira owner, normative surface, and named verification target; this is specification coverage, not implementation evidence.

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

Detailed endpoint-level contracts for API-owning Jira tickets are now documented in `02-engineering/jira-api-contracts.md`. Workspace collection routes should carry workspace context in the path, such as `/api/v1/workspaces/{workspace_id}/meetings`; meeting child routes derive workspace context from the meeting record and then enforce membership. Successful list responses use `meta` for cursor pagination, and HTTP errors use RFC 7807 Problem Details directly at the top level.

Authentication includes public bootstrap-status, atomic first-Owner/default-workspace registration, invitation validation/registration, enumeration-safe password reset, login, refresh rotation, and logout. After bootstrap, public registration closes. `POST /workspaces` and workspace switching are deferred to v1.2 and must not be exposed by v1 clients or OpenAPI.

## AI Pipeline

The docs describe two processing modes:

1. Chrome extension real-time streaming pipeline via the versioned WebSocket protocol for live tab audio.
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

The normative live transport is `04-backend/realtime-protocol.md`: WebSocket protocol `1.0`, Chrome 116+ service-worker/offscreen capture ownership, 16 kHz mono PCM `MM01` frames, contiguous acknowledgements, a 60-second memory-only replay buffer, explicit audio gaps, Pause/Resume, 15-second heartbeats, fresh reconnect tokens, and an eight-hour meeting limit. WebRTC is deferred.

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

Delivery planning follows ADR 015 and `02-engineering/phase-plan.md`: v1 work is organized as
Release -> dependency-gated Phase -> two-week Sprint -> Jira Ticket -> Implementation Subtask. Jira
remains authoritative for scope, assignee, points, and acceptance criteria. The phase plan controls
scheduling, entry/exit gates, shared-surface ownership, and integration handoffs; it does not create
long-lived phase branches or treat mock-only UI as completed integration.

Newly explicit v1 coverage tickets include MM-206 (profile/password), MM-307 (standalone web capture), MM-505 (workspace Actions), MM-506 (Markdown export), and MM-606 (keyword search).

When implementing a ticket, read `02-engineering/jira-tickets.md` first, then `02-engineering/jira-task-breakdown.md`, then read the matching product, backend, design, and testing docs before editing code.

For API-owning tickets, also read `02-engineering/jira-api-contracts.md` before coding. It defines endpoint payloads, auth rules, status codes, stream events, side effects, and required tests so agents do not infer API behavior from endpoint names alone.

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
- ADR 010 resolves v1 tenancy/onboarding: one default workspace is exposed per deployment; first-run bootstrap creates the Owner/workspace atomically; later registration is invitation-only; the fixed roles are Owner/Admin/Member/Viewer; arbitrary workspace creation/switching is v1.2.
- ADR 011 resolves live transport/lifecycle: v1 uses the versioned acknowledged WebSocket protocol, Manifest V3 offscreen capture ownership on Chrome 116+, bounded replay and explicit gaps; WebRTC is deferred.
- ADR 012 makes `04-backend/data-dictionary.md` canonical for tenant persistence and AI provenance; embeddings live on transcript chunks and AI outputs keep immutable versions, processing lineage, and relational citations.
- ADR 013 makes the single-node, operator-controlled Docker Compose stack the normative v1 deployment; external cloud, AI, telemetry, and notification services are optional explicit integrations and are disabled by default.
- ADR 014 scopes Supabase to PostgreSQL/pgvector for development and staging only. Development and staging are isolated by schema and role, CI uses disposable local PostgreSQL, no other Supabase product is adopted, and production database hosting remains undecided.

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
- `apps/backend`: FastAPI backend scaffold with Poetry, app factory, health/auth routes, settings, logging, SQLAlchemy models, Alembic migration, and starter tests
- `apps/frontend`: early Next.js frontend scaffold with auth/app routes and initial UI components
- `apps/extension`: early Chrome extension scaffold with Vite/TypeScript files

MM-203 backend authentication now includes atomic first-Owner bootstrap, invitation validation and
single-use registration, enumeration-safe password-reset issuance, single-use reset consumption,
atomic refresh rotation, refresh-session revocation, inactive-user rejection, and sensitive-token
log redaction. Reset-token delivery uses an injectable notifier with a configurable local SMTP
adapter; delivery remains disabled by default until an operator-approved sink is configured. The
frontend now includes enumeration-safe forgot-password and single-use reset-password pages that
remove reset tokens from the visible URL and never persist them in browser storage.

Local Windows development networks without usable IPv6 must connect to the managed development
database through the project's Supabase session pooler on port 5432. The backend includes a
development-only configurator that tests the pooler before updating the ignored `.env`; FastAPI CORS
allows only configured origins and supports credentialed browser authentication.

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
