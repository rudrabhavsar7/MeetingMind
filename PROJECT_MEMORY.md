# MeetingMind Project Memory

Last reviewed: 2026-10-17

## What This Repository Is

MeetingMind is a documentation-first project for a privacy-first, self-hosted AI meeting intelligence platform. The product is now extension-first: a Chrome extension captures live meeting audio from existing meeting apps, starting with Google Meet, and the MeetingMind web console stores transcripts, summaries, action items, decisions, recordings, searchable embeddings, and cited RAG answers. Recording import and standalone web capture are secondary fallback/backfill paths.

This repo contains product, architecture, design, backend, DevOps, testing, prompt, and resource documentation, plus implementation in `apps/backend`, `apps/frontend`, and `apps/extension`. The implementation has passed the verification checks recorded in the production-v1 plan; production certification still depends on the external gates listed there.

## Core Product Understanding

The core value proposition is enterprise-grade meeting intelligence without sending sensitive meeting content to third-party cloud AI services by default.

Primary workflows:

1. On a fresh v1 deployment, the first operator bootstraps the initial Owner and one default workspace; later users register only through workspace invitations and then log in normally.
2. The user installs/connects the MeetingMind Chrome extension.
3. The user joins a supported meeting app page, starting with Google Meet.
4. The extension detects the meeting and the user explicitly starts capture.
5. The offscreen extension owner mixes tab audio and local microphone audio and streams self-framed 250-500ms PCM chunks over the v1 WebSocket protocol, alongside available source metadata. Tab audio remains audible locally; microphone audio is never routed to speakers.
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
- Production PostgreSQL 16 with pgvector is operator-controlled in `docker-compose.production.yml` per ADR 016
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

1. Chrome extension real-time streaming pipeline via the versioned WebSocket protocol for mixed live tab and local microphone audio.
2. Standalone web live capture fallback using the same stream API.
3. Batch pipeline via Celery for imported recordings and backfills.

Real-time stages:

1. Detect supported meeting app tab in the Chrome extension.
2. Create live meeting session and stream mixed tab-audio and local-microphone chunks from the offscreen owner.
3. Sync source app, URL, visible title, and visible participants where available.
4. Normalize chunks and pass them to local streaming STT.
5. Emit interim transcript events to the extension side panel and console.
6. Persist final speaker-labeled transcript segments.
7. Run rolling summary/action/decision extraction through local LLMs.
8. Generate embeddings for finalized transcript chunks.
9. Publish status and AI events to the UI.

The normative live transport is `04-backend/realtime-protocol.md`: WebSocket protocol `1.0`, Chrome 116+ service-worker/offscreen capture ownership, 16 kHz mono PCM `MM01` frames, contiguous acknowledgements, a 60-second memory-only replay buffer, explicit audio gaps, Pause/Resume, 15-second heartbeats, fresh reconnect tokens, and an eight-hour meeting limit. WebRTC is deferred.

When workspace raw-audio retention is enabled, finalization archives durable live MM01 PCM as a private, timeline-aligned WAV `MediaObject`; spool files are removed only after object readiness. Disabled retention removes spool files after transcript durability.

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
- ADR 014 scopes Supabase to PostgreSQL/pgvector for development and staging only. Development and staging are isolated by schema and role, CI uses disposable local PostgreSQL, and no other Supabase product is adopted.
- ADR 016 selects operator-controlled PostgreSQL 16 with pgvector for production v1 in `docker-compose.production.yml`. The artifact exists; release acceptance remains pending.

Future implementation should follow these decisions unless a newer ADR or user decision changes them.

## Current Repository State Observed

Root is mostly markdown documentation plus the initial backend scaffold. Key folders:

- `00-project`: vision, roadmap, architecture, glossary, metrics
- `01-product`: PRD, TRD, requirements, personas, journeys, acceptance criteria
- `02-engineering`: standards, auth, API design, folder structure, Jira tickets
- `03-design`: consolidated design system, accessibility guidance, and page-level
  interaction specifications; component APIs live in typed frontend code
- `04-backend`: API spec, DB schema, AI pipeline, RAG, storage, auth flow, tests
- `05-devops`: Docker, CI/CD, infrastructure, environments, secrets
- `06-testing`: test strategy, QA checklists, unit/integration/e2e/security/performance
- `08-resources`: the durable architecture and product decisions log
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

## Documentation Organization

The active documentation was consolidated on 2026-07-27. `DOCUMENTATION.md` is
the human-readable source-of-truth map and `.agents/context-map.md` remains the
task-routing map for agents. The redundant component-description layer was removed:
shadcn/ui and Radix own generic primitive behavior, typed frontend code owns
component APIs, and durable product interactions belong to page/product/API
contracts. Completed generation inventories, duplicated tool prompt copies, and
the duplicate engineering testing strategy were also removed. Git history preserves
the superseded material.

## Implementation Status (as of 2026-09-30)

All 19 original Jira tickets implemented across 18 PRs, all merged into main. CI is
fully green (run 33926158372 passed). 107 backend unit/integration tests pass. Ruff
lint, MyPy strict, Vitest frontend tests (10 tests), and Playwright E2E tests (31 tests)
are clean.

### Core AI Pipeline — Wired

The WebSocket `/stream` endpoint now buffers incoming MM01 PCM audio frames and, on
disconnect, writes a WAV file and dispatches the full Celery chain: transcription →
summarization → embeddings. Dependencies added to `pyproject.toml`: `faster-whisper`,
`numpy`, `httpx`, `redis`. The `audio-processor.js` AudioWorklet
module exists in `apps/extension/public/` and correctly converts Float32 tab audio to
16kHz mono PCM Int16 chunks.

**Ollama is now configured and active** (no longer mock mode). Ollama v0.33.3 is
installed on the host with models `llama3.2` (LLM) and `nomic-embed-text` (embeddings,
768 dims). Docker containers reach Ollama via `host.docker.internal:11434`.
Env vars in `.env`: `MEETINGMIND_USE_MOCK_AI=false`, `MEETINGMIND_LLM_PROVIDER=ollama`,
`MEETINGMIND_EMBEDDING_PROVIDER=ollama`, `MEETINGMIND_LLM_MODEL=llama3.2`,
`MEETINGMIND_EMBEDDING_MODEL=nomic-embed-text`, `MEETINGMIND_EMBEDDING_DIMENSIONS=768`.

Diarization still uses mock fallback (pyannote-audio excluded from Docker image to avoid
2GB PyTorch+CUDA dependency). The transcription task detects pyannote availability at
runtime and falls back to `MockDiarizationService` when the module is not installed.

The full Celery chain has been validated end-to-end: WebSocket audio → WAV file →
`process_audio` (faster-whisper transcription) → `generate_summary` (Ollama LLM) →
`build_embeddings` (Ollama nomic-embed-text). All three tasks succeed and the meeting
status progresses through `recording → transcribed → summarizing → completed`.

Key bug fixes applied during pipeline validation:
- WAV file written to `/app/uploads/stream/` (not `/tmp/meetingmind/stream`) to
  resolve PermissionError from Docker volume mounts.
- Celery chain uses `.si()` (immutable signatures) for `generate_summary` and
  `build_embeddings` to prevent upstream task results from prepending extra arguments.
- pyannote import wrapped in try/except to gracefully fall back to mock diarization.
- Added `summary_kind.auto` to the PostgreSQL enum (missing from initial migration).
- Added `deleted_at` column to `transcript_segments` table via migration.
- Fixed lazy-loading `MissingGreenlet` error in summaries endpoint using
  `selectinload(SummaryVersion.citations)`.

Note: RAG search currently does brute-force cosine similarity in Python, not pgvector
native SQL. This will need pgvector SQL operators for production scale.

### Infrastructure Running Locally

- **Docker Compose**: API (port 8000), Redis (6379), MinIO (9000/9001), Celery worker containers running.
- **Database**: Supabase session pooler (`aws-1-ap-northeast-2.pooler.supabase.com:5432`),
  async `session.py` and Alembic `migrations/env.py` both handle SSL for Supabase.
  This describes the historical development setup, not current migration state. The current migration source chain ends at `010_ai_run_leases` after `009_search_fts_indexes`; whether any deployed database has applied that revision remains unverified.
- **Frontend**: Next.js dev server on `localhost:3000`.
- **Ollama**: Host machine, `localhost:11434`. Models: `llama3.2`, `nomic-embed-text`.
- **Shared volume**: `meetingmind-uploads` mounted at `/app/uploads` in API and worker containers for WAV file handoff.

### E2E Tests

31 Playwright tests across 8 spec files, all passing in ~2.5 minutes:

| File | Tests |
|------|-------|
| `e2e/auth.spec.ts` | Login form, invalid creds error, valid login redirect, register link, protected routes |
| `e2e/dashboard.spec.ts` | Dashboard display, sidebar nav, meetings/actions/search/profile navigation |
| `e2e/meetings.spec.ts` | Meetings list, empty state, new meeting, import, invalid ID handling |
| `e2e/search.spec.ts` | Search page display, query typing |
| `e2e/settings.spec.ts` | Profile, workspace, extension settings, inter-settings navigation |
| `e2e/actions.spec.ts` | Actions page display, empty state |
| `e2e/navigation.spec.ts` | Full user journey, console error check |
| `e2e/extension-audio.spec.ts` | Direct `/meetings/{id}` endpoints, permission.html getUserMedia grant, extension popup auth UI, MM01 WebSocket audio_ack |

Test user: `t1@test.com` / `12345678` (workspace slug: `test`).

Login helpers in `e2e/helpers.ts` must call `page.waitForLoadState("networkidle")`
after `goto` before filling fields — otherwise `fill` can run before React hydration
attaches input handlers, leaving React state empty and producing spurious 401s.

### Full-Stack E2E Verification (2026-09-30)

Real-speech pipeline validated end-to-end (`test_speech_e2e.py`): 20.9s TTS PCM
streamed as MM01 frames → faster-whisper produced 6 accurate segments → Ollama
summary with key points, 3 action items, 3 decisions → keyword transcript search →
nomic-embed-text chunk embeddings → RAG `/rag/chat` answered with a cited chunk
(cosine 0.53). `test_quick.py` (sine tones) also passes with "No speech detected"
summary as designed.

Fixes made during verification:
- `SqlAlchemyMeetingActionRepository.list_action_items/list_decisions/update_action_item`
  now `selectinload(...citations)` — endpoint returned 500 `MissingGreenlet` otherwise.
- `POST /meetings/import/presigned-url` passed no `created_by_user_id` to
  `MeetingService.create_meeting` (MyPy strict caught it).
- Migration-head test updated to `002_add_deleted_at_transcript`.
- Ruff cleanups in `meeting_direct.py` and the two new migration files.
- Playwright helpers wait for hydration before filling login/register fields.
- Extension `permission.html` inline script moved to `permission.js` — MV3 CSP
  `script-src 'self'` silently blocked inline execution.
- Extension spec asserts the real workspace name from `/auth/me` (background
  overwrites any stored name with API data).

### Production v1 Implementation Snapshot (2026-10-03)

The approved production-v1 work plan is [2026-10-02-production-v1.md](docs/superpowers/plans/2026-10-02-production-v1.md). Current implementation follows extension-first capture; visible Meet participant/title metadata is best-effort and may be unavailable. Live MM01 frames persist before acknowledgement and dispatch to live transcription workers. Recording import dispatches Celery processing and uses `MediaObject`; enabled live-audio retention also archives a private `MediaObject`. Search UI supports workspace keyword search and cited Ask AI retrieval. Pipeline events use authenticated WebSocket subscriptions, Redis pub/sub, persisted transcript replay, and bounded meeting-status polling for recovery.

The independent production Compose manifest uses self-hosted PostgreSQL/pgvector per ADR 016, scoped MinIO application credentials for API/worker, and Redis `noeviction`. These are implementation facts, not production acceptance results. Do not infer release readiness from the older 2026-09-30 local-stack and test notes above.

The pinned community MinIO release does not implement bucket-level CORS. Production and development Compose set `MINIO_API_CORS_ALLOW_ORIGIN` to exact frontend origins; the server applies CORS globally and fixes allowed methods/headers. Storage bootstrap verifies this server setting and does not call unsupported `mc cors set`.

Current AI persistence includes leased `AIProcessingRun` records with bounded attempts, hashed request keys, and a stored regeneration base version. Scheduled recovery releases expired work and repairs missing transcript embeddings from active final segments. Transcript soft deletion excludes rows from normal transcript/AI/search reads while preserving immutable source text; feedback writes validate output ownership against route workspace and meeting. Summary regeneration sends current base version plus an `Idempotency-Key`; retries reuse the key, while each new UI action creates a fresh one. Repository migration tests declare `010_ai_run_leases` as Alembic head. Fresh/upgrade database execution remains a verifier gate.

### Final Implementation Verification (2026-10-03)

The final verifier reported backend 276 passed/8 skipped, PostgreSQL 8 passed, strict MyPy 86 passed, and Alembic migration 010 upgrade/downgrade/re-upgrade passed. Frontend verification passed 24 tests, build, and typecheck; extension verification passed 17 tests and production build. Production-focused test suites passed 11 and 6 checks; Compose configuration and production scripts passed. Final code review found no high- or medium-severity findings. The meeting UI uses bounded status polling to recover after event disconnect. A bounded synthetic app journey was later run on 2026-10-16; real Google Meet capture remains unverified.

These results verify implementation checks, not production certification. Remaining external gates include rotating database credentials exposed during diagnostics, provisioning/loading real cached models, live Chrome/Meet E2E, live MinIO permission checks, clean-host Compose, encrypted backup and isolated restore, and choosing a maintained S3-compatible object store. No deployment is certified.

### Key Infrastructure Notes

- **2026-10-07 extension browser verification:** `apps/frontend/extension-capture-smoke.mjs` reproduced the activeTab failure with the built extension. The toolbar now uses an explicit action listener and calls `sidePanel.open` before any await. The service worker acquires a stream ID for the explicit Meet tab after backend/offscreen setup, immediately before offscreen consumption. The disposable headed Chromium smoke test passed opening, non-silent tab audio/MM01 acknowledgements, Pause/Resume, panel reload during capture, Stop/release/finalization, and a second Start/Stop. HTTP/WebSocket endpoints are local fixtures; this does not certify real Meet or the AI pipeline. Run `npm run test:extension-smoke` in `apps/frontend`.

- Backend Dockerfile required `poetry-plugin-export` for Poetry 2.x compatibility.
- Auth token is in-memory only (`lib/api.ts`), not persisted to localStorage.
- `POST /workspaces` and workspace switching are deferred to v1.2 per ADR 010.
- **Audio Capture & Mixing**: The service worker acquires a one-use Google Meet tab stream ID with `chrome.tabCapture.getMediaStreamId({targetTabId})` and immediately transfers it to the offscreen owner. Offscreen consumes it via `getUserMedia` with `chromeMediaSource: "tab"`, separately obtains local microphone audio through `getUserMedia({ audio: true })`, and mixes both into the `AudioWorkletNode`. Only the tab source connects to `audioContext.destination` to preserve audibility; microphone audio never connects there. Microphone permission failure routes through a typed runtime message so the service worker opens `permission.html`; both streams stop during cleanup. Required capture permissions are `tabCapture` and `offscreen` plus normal microphone user permission; there is no `audioCapture` manifest permission or `getDisplayMedia` in this flow.
- **Meeting Data Routes**: Mounted `/meetings/{meeting_id}/*` directly in FastAPI (`app/api/v1/meeting_direct.py`) to satisfy API Spec section 4.5, eliminating 404s on `/meetings/{id}/transcript`, `/action-items`, `/decisions`, and `/summaries`.
- **LLM JSON Parsing**: Added robust markdown code-fence and substring JSON extraction in `app/services/ai.py` to ensure Ollama outputs parse reliably into summaries, action items, and decisions.
- **Compose healthchecks**: frontend and nginx healthchecks must use `127.0.0.1` (Alpine `wget` resolves `localhost` to IPv6 `::1` while the servers listen on IPv4); worker healthcheck uses `celery inspect ping` because the shared backend Dockerfile `HEALTHCHECK` curls the API port the worker does not serve.
- **Ollama container disabled**: host Ollama owns port 11434, so the compose `ollama` service is behind profile `ollama-container` (enable with `docker compose --profile ollama-container up`). Containers reach host Ollama via `host.docker.internal:11434`.
- **Windows host quirks**: `core.autocrlf=true` makes local `ruff format --check` report CRLF-only diffs; verify formatting on an LF-normalized copy (CI is authoritative). Backend checks run in a throwaway `meetingmind-api` container (`--user root`, pip install pinned `pytest==8.4.2`, `ruff==0.8.6`, `mypy==1.20.2`, `aiosqlite`) since host has no Poetry.

### Dashboard and Connection Verification (2026-10-08)

Dashboard data fixes and connection changes are implemented. The dashboard reads its 10-row feed separately from workspace-wide current-week aggregates, sends list filters to the API, polls active meetings every 5 seconds / otherwise every 15 seconds, and restores action-item query caches after failed optimistic updates. Extension presence is advisory: authenticated user/workspace-scoped Redis state uses a 60-second TTL and reports recent activity only within 45 seconds. Frontend REST defaults to same-origin; pipeline WebSockets derive `ws:`/`wss:` from page origin; local extension console links map API port 8000 to Nginx port 80.

Verification record: [dashboard-flow-verification.md](docs/testing/dashboard-flow-verification.md). The synthetic headed-Chromium fixture passed extension capture start/pause/resume/reload/stop, non-silent MM01 acknowledgements, dashboard creation/completion refresh without reload, 10-card feed vs. aggregate count, filters, action success, and rollback. The local read-only browser check passed dashboard and action filters; an active development meeting's pipeline-events socket upgraded with status 101 through Nginx after the missing `/api/v1/.../pipeline-events` upgrade location was added to `nginx/default.conf`. Presence GET returned HTTP 200/`inactive` because no recent panel heartbeat was in the check session. Real AI output, real capture-to-database persistence, and transcript content were not certified; the selected real detail had zero transcript segments. One direct 100-row read-only list query timed out, while normal UI requests passed; large-list latency remains separate follow-up.

An earlier diagnostic timeout exposed authentication headers in a local tool trace. A subsequent fresh verification session was logged out, but logout of the earlier session could not be confirmed; do not claim its revocation. No broad session revocation or credential rotation was performed.

### Synthetic Application Journey Verification (2026-10-16)

The bounded synthetic extension-to-dashboard journey now passes live capture, transcript persistence, cited summary/action/decision generation, grounded and refused RAG queries, keyword result navigation, Markdown download, privacy flow, UI logout, and soft-delete verification. Capture acknowledged 34 frames, including an exact 440 ms tail and a one-second pause/resume gap; duplicate end was idempotent. The detailed evidence and scope limits are in [final-user-journey-repair-verification-2026-10-16.md](docs/testing/final-user-journey-repair-verification-2026-10-16.md). This does not certify a real Google Meet call or every application feature.

The October 16 repair verification also records the Nginx stale-DNS and production default-server fixes, 11 passing production contract checks, and validation with the exact production Nginx image. Production certificate provisioning remains operator-owned. Import readiness was checked, but no live upload/import ran; gated pyannote weights remain the demonstrated external processing prerequisite. Earlier journey reports below or in `docs/testing/` remain historical snapshots and should not be read as current status where the October 16 report supersedes them.
