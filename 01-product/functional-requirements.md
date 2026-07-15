---
Title: MeetingMind — Functional Requirements
Version: 1.2.0
Status: Approved
Owner: Senior Product Manager
Last Updated: 2026-07-11
Dependencies: 01-product/prd.md
---

# MeetingMind — Functional Requirements (v1.0)

This document details the specific, testable functional requirements for the MVP release. 

## 1. Authentication (FR-001 to FR-010)

| ID | Title | Description | Acceptance Criteria (Given / When / Then) | Priority |
|---|---|---|---|---|
| **FR-001** | First-Run Owner Bootstrap | A fresh deployment lets the first operator create the initial Owner and default workspace. | **Given** the deployment has zero users<br>**When** the operator submits valid owner and workspace details<br>**Then** one Owner, one default workspace, and one Owner membership are created atomically. | P0 |
| **FR-002** | Password Complexity | The system must enforce strong passwords. | **Given** a user is registering<br>**When** they enter a password < 8 chars or lacking numbers<br>**Then** the form rejects the input with an error. | P0 |
| **FR-003** | Invitation-Only Registration | After bootstrap, a new user can register only through a valid workspace invitation. | **Given** bootstrap is complete<br>**When** a user submits registration without a valid invitation<br>**Then** registration is rejected without creating a user or workspace. | P0 |
| **FR-004** | User Login | Users can authenticate with credentials. | **Given** an existing user<br>**When** they submit correct credentials on `/login`<br>**Then** they receive an access token and are redirected to `/dashboard`. | P0 |
| **FR-005** | Session Management | The system keeps users logged in across browser sessions using rotating refresh tokens. | **Given** a logged-in user closes the browser<br>**When** they return within 7 days<br>**Then** they are authenticated through a rotated HttpOnly refresh cookie. | P0 |
| **FR-006** | Workspace Invitations | Owners and Admins can invite a user to the default workspace with an allowed role. | **Given** an authorized inviter<br>**When** they invite an email address<br>**Then** a single-use, expiring invitation is created and no membership exists until acceptance. | P0 |
| **FR-007** | Workspace RBAC | The backend enforces Owner, Admin, Member, and Viewer permissions. | **Given** an authenticated workspace member<br>**When** they request an operation outside their role<br>**Then** the API returns `403` without changing data. | P0 |
| **FR-008** | Single Workspace v1 | v1 exposes only the deployment's default workspace. | **Given** any v1 user<br>**When** workspace context is loaded<br>**Then** at most one active workspace is returned and no create/switch workspace action is available. | P0 |
| **FR-009** | Password Reset | Users can reset a forgotten password through a single-use expiring link. | **Given** a reset request for any email<br>**When** the request is submitted<br>**Then** the response is generic and a token is issued only for an existing active user. | P0 |
| **FR-010** | Logout | Users can end their current session. | **Given** an authenticated or refresh-cookie session<br>**When** logout is requested<br>**Then** the refresh token is revoked, the cookie is cleared, and reuse fails. | P0 |

## 2. Extension-Based Real-Time Meeting Capture (FR-011 to FR-018)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-011** | Extension Authentication | Users can connect the Chrome extension to the deployment's default workspace. | **Given** a logged-in user installs the extension<br>**When** they click Connect<br>**Then** the extension receives a short-lived device/session token scoped to their default workspace. | P0 |
| **FR-012** | Meeting Page Detection | The extension detects supported meeting apps. | **Given** a user opens Google Meet in Chrome<br>**When** they join a meeting<br>**Then** the MeetingMind extension shows a capture-ready state for that tab. | P0 |
| **FR-013** | Start Extension Capture | Users can start capture from the extension. | **Given** the extension detects a supported meeting<br>**When** the user clicks Start Capture and grants tab audio permission<br>**Then** a Meeting record is created and the extension enters Recording state. | P0 |
| **FR-014** | Audio Streaming | The extension streams tab audio through the versioned WebSocket protocol. | **Given** a live capture session is active<br>**When** meeting audio is present<br>**Then** the offscreen capture owner sends acknowledged 250-500ms PCM frames without routing through file upload. | P0 |
| **FR-015** | Meeting Context Sync | The extension syncs available meeting metadata. | **Given** a capture session starts<br>**When** the source page exposes metadata<br>**Then** source app, meeting URL, title, start time, and visible participants are saved to the Meeting record. | P0 |
| **FR-016** | Live Transcript Updates | The extension and console display live transcription. | **Given** the backend receives speech audio<br>**When** interim and final transcript events are produced<br>**Then** the UI renders interim text and persists final speaker-labeled segments. | P0 |
| **FR-017** | Recording Import Fallback | Users can import existing recordings. | **Given** a user has an MP3, MP4, WAV, M4A, or WebM file up to 2GB<br>**When** they use the import flow<br>**Then** the file uploads directly to MinIO via presigned URL and enters batch processing. | P1 |
| **FR-018** | Standalone Web Capture Fallback | Users can capture from the MeetingMind web app when the extension cannot detect a meeting app. | **Given** a user is on `/meetings/new`<br>**When** they grant microphone permission and click Start<br>**Then** a Meeting record is created and processed with the same live pipeline. | P2 |

## 3. Transcription & Analysis (FR-021 to FR-028)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-021** | Streaming ASR Execution | The system transcribes live audio using local streaming STT. | **Given** audio chunks arrive from a live session<br>**When** they are passed to the STT module<br>**Then** interim and final transcript events with timestamps are returned. | P0 |
| **FR-022** | Streaming Diarization | The system tags speakers during live capture. | **Given** final transcript segments are produced<br>**When** diarization is available<br>**Then** each segment is saved with a speaker label and timestamp range. | P0 |
| **FR-023** | Recording Import Processing | Imported recordings use the batch pipeline. | **Given** an MP4 is imported<br>**When** processing begins<br>**Then** the Celery worker uses FFmpeg to extract normalized WAV and process it in safe chunks. | P1 |
| **FR-024** | Rolling LLM Summarization | The system generates versioned rolling summaries during the meeting. | **Given** final transcript segments are available<br>**When** the rolling context buffer updates<br>**Then** a new draft/current summary version is saved with source citations and run lineage. | P0 |
| **FR-025** | Live Action Extraction | The system identifies actionable tasks during or shortly after the meeting. | **Given** a transcript segment contains a commitment<br>**When** analyzed by the LLM pipeline<br>**Then** a discrete Action Item record is created with a source citation. | P0 |
| **FR-026** | Decision Extraction | The system records explicit decisions with rationale. | **Given** cited transcript evidence contains an agreement<br>**When** analyzed by the LLM pipeline<br>**Then** a Decision is created with at least one exact source citation. | P0 |
| **FR-027** | AI Run Provenance | Persisted AI output records how it was generated. | **Given** an AI stage runs<br>**When** it creates or updates user-visible output<br>**Then** provider, model, prompt version, input hash/range, status, and citations remain auditable. | P0 |
| **FR-028** | Non-Destructive Regeneration | Reprocessing preserves prior output history. | **Given** a meeting already has current AI output<br>**When** analysis is rerun or a user edits a summary<br>**Then** new versions are appended and earlier output/citations are retained until lifecycle deletion. | P0 |

## 4. Search & RAG (FR-041 to FR-045)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-041** | Vector Generation | Versioned transcript chunks are embedded for search. | **Given** final transcript segments<br>**When** embedding runs<br>**Then** idempotent `TranscriptChunk` rows store direct workspace scope, source boundaries, content/model versions, and local BGE `vector(768)` embeddings. | P0 |
| **FR-042** | Semantic Query | Users can search via natural language. | **Given** a user types a question in AI search<br>**When** they submit<br>**Then** the system retrieves the top 5 most relevant chunks via Cosine Similarity. | P0 |
| **FR-043** | RAG Answer | The system generates answers based on context. | **Given** retrieved chunks from FR-042<br>**When** passed to the LLM<br>**Then** an answer is streamed back to the user interface. | P0 |
| **FR-044** | Citations | RAG answers include source links. | **Given** a generated RAG answer<br>**When** the user clicks a [1] citation<br>**Then** they are navigated to the exact meeting and timestamp. | P1 |
| **FR-045** | Workspace Keyword Search | Users can search meeting titles and transcript text without invoking an LLM. | **Given** an authenticated workspace member<br>**When** they submit a non-empty keyword query<br>**Then** matching meetings/segments from only that workspace are returned with timestamp snippets. | P0 |

## 5. User Interface and Output (FR-051 to FR-055)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-051** | Dashboard Feed | Users see recent meetings. | **Given** a logged-in user<br>**When** they visit /dashboard<br>**Then** they see a chronological list of the last 10 meetings. | P0 |
| **FR-052** | Action Item Tracker | Users can manage their tasks. | **Given** a user has assigned action items<br>**When** they visit the Actions page<br>**Then** they can mark items as complete or edit them. | P0 |
| **FR-053** | Transcript Viewer | The UI displays the transcript readably. | **Given** a processed meeting<br>**When** the user opens the Transcript tab<br>**Then** they see text organized by speaker and timestamp. | P0 |
| **FR-054** | Profile Management | Users can update their display name and password. | **Given** an authenticated user<br>**When** they submit valid profile or current/new password data<br>**Then** the change is persisted, audited where security-sensitive, and other sessions are revoked after a password change. | P1 |
| **FR-055** | Markdown Export | Users can export a completed meeting as Markdown. | **Given** a member can view a completed meeting<br>**When** they request Markdown export<br>**Then** a UTF-8 `.md` file containing title, current cited summary, actions, decisions, and transcript is downloaded without exposing private object keys. | P1 |
