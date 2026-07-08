---
Title: MeetingMind — Engineering: Detailed Jira Tickets
Version: 2.0.0
Status: Approved
Owner: Project Manager
Last Updated: 2026-06-28
Dependencies: None
Related Documents:
  - 02-engineering/jira-task-breakdown.md
---

# MeetingMind: Detailed Jira Epics & Tasks

For implementation-level subtasks, dependency sequencing, verification steps, and handoff notes, use `02-engineering/jira-task-breakdown.md` alongside this backlog.

## Team Allocation Refresher
* **Rudra:** Backend & AI Engineer (FastAPI, Celery, Whisper, RAG)
* **Jenil:** Product Manager / Full Stack (API hooks, State, Auth flows)
* **Prashant:** Frontend Engineer (Next.js, UI/UX, shadcn/ui)
* **Arnish:** DevOps & DB Engineer (Postgres, AWS, Docker, CI/CD)

---

## 🏗️ Module 1: Project Foundation & DevOps (Epic: MM-100)

### MM-101: Scaffold GitHub Repo & CI/CD Actions
* **Assignee:** Arnish | **Type:** Task | **Points:** 3
* **Description:** Initialize the monorepo structure. Create GitHub Action workflows for automated testing and linting.
* **Acceptance Criteria:**
  - Repo contains `/apps/frontend` and `/apps/backend` directories.
  - PRs to `main` trigger CI checks.
  - CI pipeline correctly fails if Python `ruff`/`mypy` or Next.js `eslint` fails.

### MM-102: Scaffold Next.js 15 Project & Design System
* **Assignee:** Prashant | **Type:** Task | **Points:** 2
* **Description:** Initialize Next.js 15 App Router. Install Tailwind CSS and Shadcn/ui.
* **Acceptance Criteria:**
  - Next.js app runs locally on port 3000.
  - `globals.css` is configured with the Emerald primary brand color.
  - Base components (Button, Input, Card) from shadcn are installed.

### MM-103: Scaffold FastAPI & Poetry Environment
* **Assignee:** Rudra | **Type:** Task | **Points:** 2
* **Description:** Initialize the backend Python project using Poetry for dependency management.
* **Acceptance Criteria:**
  - FastAPI server runs locally on port 8000 via Uvicorn.
  - `/docs` Swagger UI is accessible.
  - `pyproject.toml` is configured with basic dependencies (fastapi, pydantic, sqlalchemy).

### MM-104: Create Local `docker-compose.yml`
* **Assignee:** Arnish | **Type:** Task | **Points:** 3
* **Description:** Create a local dev environment that spins up all necessary services.
* **Acceptance Criteria:**
  - `docker-compose up` spins up: PostgreSQL (with pgvector), Redis, FastAPI API, and Celery worker.
  - Backend can connect to the database and Redis instances via environment variables.

---

## 🔐 Module 2: Database & Authentication (Epic: MM-200)

### MM-201: Define SQLAlchemy Core Models
* **Assignee:** Rudra | **Type:** Task | **Points:** 3
* **Description:** Write the ORM models for the core entities using async SQLAlchemy.
* **Acceptance Criteria:**
  - `User`, `Workspace`, and `WorkspaceMembership` models are defined.
  - UUIDv4 is used for all primary keys.
  - Relationships (1:Many, Many:Many) are properly configured.

### MM-202: Setup Alembic Migrations
* **Assignee:** Arnish | **Type:** Task | **Points:** 2
* **Description:** Configure Alembic for database schema versioning.
* **Acceptance Criteria:**
  - `alembic init` configured.
  - The first migration script successfully creates the tables defined in MM-201.

### MM-203: Backend JWT Authentication Flow
* **Assignee:** Rudra | **Type:** Story | **Points:** 5
* **Description:** Implement email/password registration and login endpoints.
* **Acceptance Criteria:**
  - `POST /auth/register` hashes the password using `bcrypt` and saves the user.
  - `POST /auth/login` returns a short-lived Access Token and a long-lived Refresh Token (HttpOnly Cookie).
  - Unauthenticated requests to protected routes return `401 Unauthorized`.

### MM-204: Frontend Auth UI & Session State
* **Assignee:** Prashant | **Type:** Story | **Points:** 3
* **Description:** Build the Login and Registration screens and manage the JWT session.
* **Acceptance Criteria:**
  - Visually polished `/login` and `/register` pages exist.
  - Submitting the form successfully logs the user in and redirects to `/dashboard`.
  - Token is securely stored and attached to subsequent API requests.

### MM-205: Implement RBAC Middleware
* **Assignee:** Jenil | **Type:** Task | **Points:** 3
* **Description:** Ensure users can only access data belonging to their workspace.
* **Acceptance Criteria:**
  - A FastAPI Dependency checks if the current user belongs to the requested `workspace_id`.
  - Returns `403 Forbidden` if they do not belong to the workspace.

---

## ☁️ Module 3: Chrome Extension Capture & Storage (Epic: MM-300)

### MM-301: Provision Object Storage & Realtime CORS
* **Assignee:** Arnish | **Type:** Task | **Points:** 2
* **Description:** Set up S3-compatible object storage for optional live audio archives, imported recordings, and exports.
* **Acceptance Criteria:**
  - S3 Bucket is strictly private.
  - CORS rules allow presigned import `PUT` requests and retained-media `GET` requests from the frontend domain (`localhost:3000` and `*.meetingmind.app`).

### MM-302: Create Extension Connection & Live Session Endpoints
* **Assignee:** Rudra | **Type:** Task | **Points:** 3
* **Description:** Backend endpoints to connect the Chrome extension and create extension-originated live capture sessions.
* **Acceptance Criteria:**
  - `POST /extension/connect` exchanges a logged-in browser session for a short-lived extension token.
  - `POST /workspaces/{workspace_id}/meetings/live` creates a Meeting with status `recording`.
  - The live session payload accepts `client_type`, `source_app`, `source_url`, `source_title`, and visible participants.
  - Returns meeting ID, stream URL, and short-lived stream authorization token.
  - Rejects users who are not members of the workspace.

### MM-303: Chrome Extension Capture UI
* **Assignee:** Prashant | **Type:** Story | **Points:** 5
* **Description:** Build the Chrome extension popup/side panel where users connect a workspace, start/stop capture, and view live transcript status.
* **Acceptance Criteria:**
  - Detects an active Google Meet tab.
  - Requests tab audio permission only after the user clicks Start Capture.
  - Starts and stops an extension capture session.
  - Displays Recording, Connecting, Transcribing, Analyzing, Completed, and Failed states.
  - Shows interim and final transcript segments as events arrive.

### MM-304: Wire Extension Tab Audio Stream to Backend
* **Assignee:** Jenil | **Type:** Task | **Points:** 5
* **Description:** Connect the Chrome extension to the backend WebSocket stream.
* **Acceptance Criteria:**
  - Extension creates a live meeting session through the API.
  - Extension streams 250-500ms tab-audio chunks over WebSocket/WebRTC.
  - Extension sends source app, source URL, visible title, and visible participants when accessible.
  - Extension handles `transcript_interim`, `transcript_final`, `action_item_detected`, `summary_updated`, and `meeting_completed` events.
  - Connection loss shows a recoverable error state.

### MM-306: Console Extension Settings
* **Assignee:** Prashant | **Type:** Task | **Points:** 3
* **Description:** Build `/settings/extension` for extension connection, workspace selection, and capture preferences.
* **Acceptance Criteria:**
  - Shows extension connection status.
  - Lets users select default workspace for captures.
  - Shows raw audio retention setting from workspace policy.
  - Provides install/open-extension guidance.

### MM-305: Recording Import Fallback
* **Assignee:** Jenil | **Type:** Task | **Points:** 3
* **Description:** Keep a secondary recording import flow for historical meetings and fallback capture.
* **Acceptance Criteria:**
  - `POST /workspaces/{workspace_id}/meetings/import/presigned-url` accepts filename, MIME type, and file size.
  - Returns a temporary S3-compatible PUT URL valid for 15 minutes.
  - Frontend PUTs the file directly to object storage and notifies the API on completion.

---

## 🧠 Module 4: The AI Pipeline (Epic: MM-400)

### MM-401: Setup Celery Infrastructure
* **Assignee:** Arnish | **Type:** Task | **Points:** 3
* **Description:** Configure Celery to consume tasks from Redis.
* **Acceptance Criteria:**
  - Celery worker successfully boots up and registers with the Redis broker.
  - `tasks.py` is configured and can execute a dummy `ping` task.

### MM-402: Streaming Audio Ingestion Task
* **Assignee:** Rudra | **Type:** Task | **Points:** 3
* **Description:** First stage of the extension real-time pipeline. Accept and normalize live tab-audio chunks.
* **Acceptance Criteria:**
  - Backend accepts authenticated extension audio chunks for an active meeting.
  - Audio chunks are normalized to the streaming STT input format.
  - Invalid or out-of-order chunks are rejected or recovered without corrupting the meeting transcript.

### MM-403: Transcription & Diarization Task
* **Assignee:** Rudra | **Type:** Task | **Points:** 8
* **Description:** The core ML task. Convert audio to speaker-labeled text.
* **Acceptance Criteria:**
  - Local streaming STT emits interim and final transcript events.
  - Online diarization tags final transcript segments with speaker labels.
  - Outputs persisted `TranscriptSegment` objects mapping text to speakers and timestamps.

### MM-404: LLM Summarization Task
* **Assignee:** Rudra | **Type:** Task | **Points:** 5
* **Description:** Use an LLM to generate the Executive Summary and Action Items.
* **Acceptance Criteria:**
  - Passes rolling transcript context to Ollama by default.
  - Parses structured JSON output and saves Summary, Action Items, and Decisions to PostgreSQL with citations.

### MM-405: Real-Time Pipeline Events (WebSockets)
* **Assignee:** Jenil | **Type:** Task | **Points:** 5
* **Description:** Keep the frontend updated on the pipeline status.
* **Acceptance Criteria:**
  - Frontend connects via WebSocket.
  - Backend emits events (`transcribing`, `summarizing`, `completed`).
  - Frontend UI updates the `RecordingStatus` component in real-time.

---

## 🖥️ Module 5: Core Application UI (Epic: MM-500)

### MM-501: Dashboard Meeting List
* **Assignee:** Prashant | **Type:** Story | **Points:** 3
* **Description:** The main view showing historical meetings.
* **Acceptance Criteria:**
  - Fetches data using TanStack Query.
  - Displays meetings in a grid of `MeetingCard` components.
  - Shows an Empty State if no meetings exist.

### MM-502: Meeting Details & Summary View
* **Assignee:** Prashant | **Type:** Story | **Points:** 3
* **Description:** The detailed view of a specific meeting.
* **Acceptance Criteria:**
  - Renders the Executive Summary in a clean, readable format.
  - Displays Action Items in a checklist (can be checked/unchecked).

### MM-503: Interactive Transcript Viewer
* **Assignee:** Prashant | **Type:** Story | **Points:** 8
* **Description:** The complex UI for reading the transcript.
* **Acceptance Criteria:**
  - Renders chat-bubble style `TranscriptSegments` with `SpeakerChips`.
  - Uses virtualization (TanStack Virtual) to prevent DOM lag on 3-hour meetings.

### MM-504: Video Playback & Timestamp Sync
* **Assignee:** Jenil | **Type:** Story | **Points:** 5
* **Description:** Link the transcript to the raw video.
* **Acceptance Criteria:**
  - Clicking a timestamp in the transcript seeks the HTML5 `<video>` player to that exact second.

---

## 🔎 Module 6: RAG Search & "Ask AI" (Epic: MM-600)

### MM-601: Setup `pgvector` & Indexes
* **Assignee:** Arnish | **Type:** Task | **Points:** 2
* **Description:** Configure the vector database.
* **Acceptance Criteria:**
  - Add `embedding` Vector(768) column to `TranscriptSegment`.
  - Add an HNSW index via Alembic migration.

### MM-602: Vector Embedding Pipeline Step
* **Assignee:** Rudra | **Type:** Task | **Points:** 5
* **Description:** Add the final step to the AI pipeline.
* **Acceptance Criteria:**
  - Chunks the transcript and generates vectors via an Embedding Model.
  - Inserts vectors into the database.

### MM-603: `POST /ai/chat` Endpoint
* **Assignee:** Rudra | **Type:** Task | **Points:** 5
* **Description:** The core semantic search backend logic.
* **Acceptance Criteria:**
  - Accepts a user query -> Embeds query -> Does Cosine Similarity search in Postgres (filtered by workspace).
  - Injects top results into LLM prompt and returns the answer.

### MM-604: Chat Interface UI
* **Assignee:** Prashant | **Type:** Story | **Points:** 4
* **Description:** Build the visual chat component.
* **Acceptance Criteria:**
  - Sticky input at the bottom of the screen.
  - Displays message history (User bubbles on right, AI bubbles on left).
  - Renders Markdown and lists properly.

### MM-605: Chat API Integration & Citations
* **Assignee:** Jenil | **Type:** Task | **Points:** 3
* **Description:** Connect the Chat UI to the backend.
* **Acceptance Criteria:**
  - Sends user queries to the backend.
  - Renders citation links (e.g., `[1]`) that, when clicked, jump to the correct transcript timestamp.

---

## Appendix A: Implementation-Ready Task Details

Use this appendix as the Jira import/task creation checklist. `02-engineering/jira-task-breakdown.md` remains the expanded workflow document; this section keeps the main Jira backlog self-contained.

### MM-101: Detailed Tasks
- Create monorepo folders: `apps/frontend`, `apps/backend`, `apps/extension`, and shared package space only if needed.
- Add root scripts for lint, test, typecheck, format, and build orchestration.
- Add backend CI jobs for dependency install, Ruff, MyPy, and pytest.
- Add frontend and extension CI jobs for dependency install, ESLint, typecheck, build, and tests.
- Add Python and Node dependency caching.
- Document required branch protection checks.

### MM-102: Detailed Tasks
- Initialize the Next.js App Router frontend in `apps/frontend`.
- Configure strict TypeScript, path aliases, and Next linting.
- Install Tailwind CSS v4, shadcn/ui-compatible primitives, lucide-react, TanStack Query, and Zustand.
- Configure semantic CSS tokens for background, foreground, primary, card, border, muted, destructive, ring, and sidebar states.
- Add light/dark theme-compatible global styles.
- Add base UI primitives: Button, Input, Card, Dialog, Dropdown, Toast or equivalents.
- Verify local frontend startup, lint, typecheck, and production build.

### MM-103: Detailed Tasks
- Initialize `apps/backend` with Poetry or the selected Python dependency manager.
- Add FastAPI app factory and root `/health` endpoint.
- Mount `/api/v1` router and versioned health route.
- Add Pydantic settings for database, Redis, storage, JWT, CORS, and environment mode.
- Add request ID and process time middleware.
- Add structured logging to stdout/stderr.
- Add Ruff, MyPy strict mode, pytest, and pytest-asyncio configuration.
- Add starter health and settings tests.

### MM-104: Detailed Tasks
- Add local Docker Compose services for API, Celery worker, PostgreSQL 16 with pgvector, Redis, and MinIO.
- Add local `.env.example` values without real secrets.
- Configure health checks and service dependency ordering.
- Mount local volumes for PostgreSQL and MinIO data.
- Add bootstrap instructions for local owner/admin user if needed.
- Document common commands for logs, migrations, workers, tests, and environment reset.

### MM-201: Detailed Tasks
- Create SQLAlchemy async engine/session utilities and declarative base.
- Add UUID primary key and timestamp mixins.
- Define `User`, `Workspace`, and `WorkspaceMembership` models.
- Define `Meeting`, `TranscriptSegment`, `ActionItem`, and `Decision` models.
- Add workspace foreign keys to all tenant-scoped entities.
- Add enums for role, meeting status, source type, source app, and action item status.
- Model meeting source metadata: `client_type`, `source_app`, `source_url`, `source_title`, visible participants, media URL, retention flags, started/ended timestamps, and processing status.
- Add indexes for workspace filtering, meeting chronology, meeting status, transcript lookup, and action item lookup.
- Add model import and relationship tests.

### MM-202: Detailed Tasks
- Initialize Alembic under `apps/backend`.
- Wire Alembic environment to SQLAlchemy metadata.
- Create initial migration for users, workspaces, memberships, meetings, transcript segments, action items, and decisions.
- Add pgvector extension setup in the migration path or a follow-up migration.
- Add downgrade paths where safe.
- Add migration commands to backend README or DevOps docs.
- Verify `alembic upgrade head` on a fresh database.

### MM-203: Detailed Tasks
- Add password hashing service using bcrypt or argon2.
- Add JWT access token signing, validation, subject extraction, and expiry handling.
- Add refresh token generation, hashing/storage, rotation, and revocation strategy.
- Implement register, login, refresh, logout, and current-user endpoints.
- Set refresh token as HttpOnly cookie with secure production settings and local development compatibility.
- Add duplicate-email, invalid-credentials, expired-token, revoked-token, and inactive-user errors.
- Add `get_current_user` FastAPI dependency.
- Add unit tests for hashing and token logic.
- Add integration tests for registration, login, refresh, logout, current user, and unauthenticated access.

### MM-204: Detailed Tasks
- Build `/login` and `/register` pages with accessible forms.
- Add client-side validation and API error handling.
- Add auth API client and typed request/response contracts.
- Store access token in memory only.
- Bootstrap session from refresh cookie.
- Attach bearer token to API requests.
- Redirect successful login/register to dashboard.
- Redirect expired or unauthenticated sessions to login.
- Add tests for form validation, error states, and redirect behavior.

### MM-205: Detailed Tasks
- Add workspace membership lookup dependency.
- Add `require_workspace_member` and `require_workspace_role` helpers.
- Support Owner/Admin/Member/Viewer role checks.
- Apply workspace authorization to workspace, meeting, transcript, action item, decision, extension, import, and AI routes.
- Add standardized 403 Problem Details responses.
- Add test fixtures for cross-workspace users and roles.
- Verify non-members cannot access workspace-scoped resources.

### MM-301: Detailed Tasks
- Configure private MinIO/S3 bucket for imports, optional retained media, and exports.
- Add backend storage client abstraction.
- Add object key conventions scoped by workspace and meeting.
- Add presigned PUT and GET URL support.
- Configure CORS for frontend import PUT and retained-media GET flows.
- Add retention policy configuration hooks.
- Verify private bucket access and presigned upload/download behavior.

### MM-302: Detailed Tasks
- Implement extension token issuance scoped to user and workspace.
- Implement extension connect, capabilities, and heartbeat endpoints.
- Implement live meeting session creation under workspace meetings.
- Validate `client_type`, `source_app`, `source_url`, `source_title`, visible participants, and workspace membership.
- Create a `Meeting` with status `recording` and source type `extension_capture` or `standalone_web_capture`.
- Return meeting ID, stream URL, stream token, token expiry, and supported event schema version.
- Add tests for member success, non-member 403, invalid source metadata, and stream token expiry.

### MM-303: Detailed Tasks
- Create `apps/extension` Manifest V3 project.
- Add background/service worker, content script, popup, side panel, capture, API client, store, and type folders.
- Detect supported Google Meet tabs.
- Show disconnected, unsupported, ready, recording, connecting, transcribing, analyzing, completed, and failed states.
- Request tab audio permission only after Start Capture.
- Start/stop capture through backend live session APIs.
- Render elapsed time, status, interim transcript, final transcript, and recoverable errors.
- Add accessible keyboard controls and screen-reader labels.

### MM-304: Detailed Tasks
- Capture tab audio after user consent.
- Encode or normalize audio into backend-supported chunk format.
- Open authenticated stream using meeting stream token.
- Send 250-500ms chunks with sequence numbers and timestamps.
- Send source app, source URL, visible title, and visible participants when accessible.
- Handle backend events for interim transcript, final transcript, action items, summary updates, completion, and errors.
- Add reconnection and recoverable error handling.

### MM-305: Detailed Tasks
- Build import flow under `/meetings/import` or equivalent UI entry.
- Validate filename, MIME type, file extension, and size on the frontend.
- Request presigned upload URL from backend.
- Upload directly to object storage with PUT.
- Notify API when upload completes.
- Create or update a meeting with source type `recording_import`.
- Show upload progress, retry, success, failed, and queued-for-processing states.
- Verify backend validates MIME type and magic bytes.

### MM-306: Detailed Tasks
- Build `/settings/extension`.
- Show extension connection status and last heartbeat.
- Show supported meeting apps and rollout flags.
- Let user choose default workspace for captures.
- Display raw audio retention policy.
- Provide install/open-extension guidance.
- Add disconnect or reset extension token action if supported by backend.
- Persist workspace selection through API.

### MM-401: Detailed Tasks
- Configure Celery app with Redis broker and result backend.
- Add worker entrypoint and queue names.
- Add dummy `ping` task.
- Add worker health check.
- Define retry, timeout, idempotency, and logging conventions.
- Add meeting/workspace IDs to task logs.
- Add worker service to Docker Compose.
- Verify worker boot and `ping` execution.

### MM-402: Detailed Tasks
- Implement authenticated WebSocket receive loop for active meeting streams.
- Validate stream token, workspace, meeting status, and chunk metadata.
- Bound chunk size and stream duration.
- Normalize incoming audio for streaming STT.
- Track sequence numbers and recover or reject invalid chunks.
- Buffer without unbounded memory growth.
- Publish ingestion status and error events.
- Add tests for invalid token, out-of-order chunks, oversized chunks, and closed meetings.

### MM-403: Detailed Tasks
- Add local streaming STT provider abstraction.
- Integrate default local Whisper/faster-whisper-compatible provider.
- Emit interim transcript events.
- Persist final transcript segments with timestamps.
- Add diarization provider abstraction or speaker-label fallback.
- Map transcript segments to meeting and workspace safely.
- Add batch import transcription path using the same segment model.
- Add tests with mocked STT/diarization providers and sample audio fixtures where practical.

### MM-404: Detailed Tasks
- Add Ollama client abstraction.
- Create prompt templates for executive summary, action items, and decisions.
- Use structured JSON output and Pydantic validation.
- Store summary, action items, and decisions with citations to transcript segments or timestamps.
- Add retry/repair handling for malformed LLM output.
- Add rolling summary updates for live capture.
- Mock Ollama in deterministic tests.
- Verify transcript is preserved if LLM output fails.

### MM-405: Detailed Tasks
- Define event schemas for status, transcript, action item, summary, error, and completion events.
- Add backend event publisher used by ingestion, STT, LLM, and embedding stages.
- Deliver events over live WebSocket to extension and console clients.
- Add fallback HTTP polling/status endpoint for non-active views.
- Add reconnection behavior and missed-event recovery strategy.
- Map frontend status UI to `recording`, `transcribing`, `analyzing`, `completed`, and `failed`.

### MM-501: Detailed Tasks
- Build dashboard route and meeting list query.
- Fetch meetings using TanStack Query.
- Render captured/imported meetings in `MeetingCard` components.
- Show source app, status, title, date, duration, creator, and participant count.
- Add empty state with Connect Extension primary CTA and Import Recording secondary CTA.
- Add loading, error, no-results, and pagination/load-more states.

### MM-502: Detailed Tasks
- Build meeting detail route.
- Fetch meeting, summary, action items, decisions, transcript availability, and source metadata.
- Render summary with cited sections where available.
- Render action items as editable/checkable checklist.
- Render decisions with rationale and timestamps.
- Show processing and failed states.
- Persist action item updates and verify after refresh.

### MM-503: Detailed Tasks
- Build transcript segment list with virtualization.
- Render speaker chips, timestamps, final/interim distinction, and active segment state.
- Add speaker rename flow if backend supports it.
- Add search within transcript.
- Add citation jump target support.
- Verify performance on 3-hour transcript fixtures.
- Ensure speaker labels and timestamps remain accessible on mobile.

### MM-504: Detailed Tasks
- Add media player for retained live audio/video or imported recordings.
- Fetch signed media URLs instead of public object URLs.
- Seek media when transcript timestamp is clicked.
- Highlight active transcript segment while media plays.
- Refresh expired signed URLs or show clear errors.
- Handle missing retained media gracefully.
- Respect workspace retention policy and user permissions.

### MM-601: Detailed Tasks
- Enable pgvector extension in migration.
- Add `embedding vector(768)` to transcript segments or a dedicated transcript chunk table.
- Add HNSW cosine index.
- Add workspace and meeting filters for vector search.
- Add migration tests or schema assertions.
- Verify query plan does not allow cross-workspace vector retrieval.

### MM-602: Detailed Tasks
- Chunk finalized transcript text into retrieval-friendly units.
- Add local embedding provider abstraction with default BGE-compatible provider.
- Generate 768-dimensional embeddings.
- Persist vectors with transcript segment references and workspace ID.
- Make re-embedding idempotent.
- Add backfill task for existing/imported meetings.
- Add retry and failure reporting.

### MM-603: Detailed Tasks
- Add workspace-scoped chat request and response schemas.
- Embed user query with local embedding provider.
- Retrieve top transcript chunks with workspace filtering.
- Build cited prompt context only from retrieved chunks.
- Call local LLM through Ollama by default.
- Return or stream answer with citations mapped to meeting IDs and transcript timestamps.
- Reject or clearly bound answers when no relevant context exists.
- Add tests proving cross-workspace retrieval is impossible.

### MM-604: Detailed Tasks
- Build Ask AI route or panel.
- Add user and assistant message bubbles.
- Add sticky input with keyboard submit.
- Add loading and streaming states.
- Render Markdown safely.
- Add cited source placeholders.
- Add empty state and example prompts based on available meetings.
- Add accessible focus handling.

### MM-605: Detailed Tasks
- Connect chat UI to `POST /workspaces/{workspace_id}/ai/chat`.
- Support SSE streaming when backend enables it.
- Render citation chips with meeting title, date, and timestamp.
- Route citation clicks to meeting details and jump to transcript segment.
- Preserve typed input on API errors.
- Handle rate limits, empty workspace, no relevant context, and backend failure states.

---

## Appendix B: Endpoint Inventory by Ticket

All REST paths below are under `/api/v1` unless explicitly marked otherwise. Workspace-scoped endpoints must enforce membership checks.

| Ticket | Method | Path | Purpose |
|---|---|---|---|
| MM-103 | GET | `/health` | Root service health endpoint outside versioned API. |
| MM-103 | GET | `/api/v1/health` | Versioned API health endpoint. |
| MM-103 | GET | `/docs` | Swagger UI for local development and API inspection. |
| MM-103 | GET | `/api/v1/openapi.json` | OpenAPI schema. |
| MM-203 | POST | `/auth/register` | Create email/password user and default workspace or membership bootstrap path. |
| MM-203 | POST | `/auth/login` | Validate credentials, return access token, set refresh cookie. |
| MM-203 | POST | `/auth/refresh` | Rotate/refresh access token from HttpOnly refresh cookie. |
| MM-203 | POST | `/auth/logout` | Revoke refresh token and clear auth cookie. |
| MM-203 | GET | `/auth/me` | Return current user and accessible workspaces. |
| MM-205 | GET | `/workspaces` | List workspaces available to current user. |
| MM-205 | POST | `/workspaces` | Create workspace and owner membership. |
| MM-205 | GET | `/workspaces/{workspace_id}` | Get workspace details for a member. |
| MM-205 | PATCH | `/workspaces/{workspace_id}` | Update workspace settings for admin/owner roles. |
| MM-205 | GET | `/workspaces/{workspace_id}/members` | List workspace members. |
| MM-205 | POST | `/workspaces/{workspace_id}/members` | Invite or add workspace member. |
| MM-205 | PATCH | `/workspaces/{workspace_id}/members/{user_id}` | Update member role. |
| MM-205 | DELETE | `/workspaces/{workspace_id}/members/{user_id}` | Remove workspace member. |
| MM-302 | POST | `/extension/connect` | Exchange web session for short-lived extension token. |
| MM-302 | GET | `/extension/capabilities` | Return supported apps, capture settings, retention policy, feature flags, and event schema version. |
| MM-302 | POST | `/extension/heartbeat` | Maintain extension connection state and active tab context. |
| MM-302 | POST | `/workspaces/{workspace_id}/meetings/live` | Create extension or standalone live capture meeting session. |
| MM-302 | POST | `/workspaces/{workspace_id}/meetings/{meeting_id}/end` | End a live capture session and mark meeting complete or ready for final processing. |
| MM-402 | WS | `/workspaces/{workspace_id}/meetings/{meeting_id}/stream` | Authenticated live audio stream and real-time event channel. |
| MM-405 | WS | `/ws/meetings/{meeting_id}/status` | Processing status channel for non-active meeting views. |
| MM-405 | GET | `/meetings/{meeting_id}/status` | HTTP polling fallback for meeting processing status. |
| MM-305 | POST | `/workspaces/{workspace_id}/meetings/import/presigned-url` | Generate presigned upload URL for recording import. |
| MM-305 | POST | `/workspaces/{workspace_id}/meetings/import-complete` | Confirm object upload and queue batch processing. |
| MM-501 | GET | `/workspaces/{workspace_id}/meetings` | List workspace meetings with cursor pagination and filters. |
| MM-501 | GET | `/workspaces/{workspace_id}/meetings/{meeting_id}` | Get meeting details and summary preview. |
| MM-501 | DELETE | `/workspaces/{workspace_id}/meetings/{meeting_id}` | Soft-delete a meeting. |
| MM-502 | GET | `/meetings/{meeting_id}/action-items` | List action items for an authorized meeting. |
| MM-502 | PATCH | `/meetings/{meeting_id}/action-items/{item_id}` | Update action item completion, assignee, due date, or text. |
| MM-502 | GET | `/meetings/{meeting_id}/decisions` | List decisions for an authorized meeting. |
| MM-503 | GET | `/meetings/{meeting_id}/transcript` | List transcript segments with cursor/range pagination. |
| MM-503 | PATCH | `/meetings/{meeting_id}/transcript/speakers/{speaker_label}` | Rename or map diarized speaker labels when supported. |
| MM-503 | GET | `/meetings/{meeting_id}/transcript/search` | Search within a meeting transcript. |
| MM-504 | GET | `/meetings/{meeting_id}/media-url` | Return signed media URL for retained recording if allowed. |
| MM-401 | GET | `/worker/health` | Optional worker/broker health endpoint for local/ops checks. |
| MM-401 | POST | `/tasks/ping` | Optional local-only dummy task trigger for Celery verification. |
| MM-603 | POST | `/workspaces/{workspace_id}/ai/chat` | Ask AI across workspace meeting history with citations. |
| MM-603 | GET | `/workspaces/{workspace_id}/ai/chat/{conversation_id}` | Optional retrieve prior chat conversation if chat history is persisted. |
| MM-605 | GET | `/meetings/{meeting_id}/citations/{segment_id}` | Optional citation resolver for jumping to transcript context. |

### Frontend Routes Owned by UI Tickets

| Ticket | Route | Purpose |
|---|---|---|
| MM-204 | `/login` | Sign in page. |
| MM-204 | `/register` | Registration page. |
| MM-501 | `/dashboard` | Workspace dashboard and recent meetings. |
| MM-501 | `/meetings` | Meeting list and import entry. |
| MM-502 | `/meetings/[id]` | Meeting summary, actions, decisions, and transcript shell. |
| MM-305 | `/meetings/import` | Recording import fallback flow. |
| MM-306 | `/settings/extension` | Extension connection and capture preferences. |
| MM-604 | `/search` | Ask AI chat interface. |

### Chrome Extension Surfaces Owned by Extension Tickets

| Ticket | Surface | Purpose |
|---|---|---|
| MM-303 | `manifest.json` | Manifest V3 permissions, side panel, popup, background service worker, and content scripts. |
| MM-303 | `src/background/*` | Auth, capture orchestration, stream lifecycle, and event routing. |
| MM-303 | `src/content/*` | Meeting app detection and visible metadata extraction. |
| MM-303 | `src/popup/*` | Compact connect/start/stop UI. |
| MM-303 | `src/sidepanel/*` | Live transcript, status, summaries, and action item view. |
| MM-304 | `src/capture/*` | Tab audio capture, chunking, sequencing, and encoding. |
| MM-304 | `src/api/*` | REST and WebSocket clients for MeetingMind backend. |
