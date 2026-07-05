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
