---
Title: MeetingMind — Functional Requirements
Version: 1.0.0
Status: Approved
Owner: Senior Product Manager
Last Updated: 2026-06-28
Dependencies: 01-product/prd.md
---

# MeetingMind — Functional Requirements (v1.0)

This document details the specific, testable functional requirements for the MVP release. 

## 1. Authentication (FR-001 to FR-010)

| ID | Title | Description | Acceptance Criteria (Given / When / Then) | Priority |
|---|---|---|---|---|
| **FR-001** | User Registration | Users can create an account with email and password. | **Given** a user is on the /register page<br>**When** they submit a valid email and strong password<br>**Then** an account is created and they are logged in. | P0 |
| **FR-002** | Password Complexity | The system must enforce strong passwords. | **Given** a user is registering<br>**When** they enter a password < 8 chars or lacking numbers<br>**Then** the form rejects the input with an error. | P0 |
| **FR-003** | User Login | Users can authenticate with credentials. | **Given** an existing user<br>**When** they submit correct credentials on /login<br>**Then** they receive a JWT and are redirected to /dashboard. | P0 |
| **FR-004** | Session Management | The system must keep users logged in across sessions using refresh tokens. | **Given** a logged-in user closes the browser<br>**When** they return within 7 days<br>**Then** they are automatically authenticated via HttpOnly cookie. | P1 |

## 2. Meeting Upload (FR-011 to FR-020)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-011** | File Type Validation | The system accepts only supported media types. | **Given** a user is on the upload page<br>**When** they drop a .pdf file<br>**Then** the UI rejects the file before upload begins. | P0 |
| **FR-012** | File Size Limit | The system rejects files over 2GB. | **Given** a valid video file of 2.5GB<br>**When** the user attempts upload<br>**Then** the system rejects it with a clear size limit error. | P0 |
| **FR-013** | Direct Storage Upload | Files upload directly to MinIO via presigned URLs. | **Given** a user uploads a valid file<br>**When** the upload begins<br>**Then** the client requests a presigned URL and PUTs directly to storage, bypassing the API. | P0 |
| **FR-014** | Progress Indicator | The UI shows upload progress. | **Given** a large file is uploading<br>**When** data is transferring<br>**Then** the UI displays a percentage and progress bar. | P1 |

## 3. Transcription & Analysis (FR-021 to FR-040)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-021** | Audio Extraction | The system extracts audio from video files. | **Given** an MP4 is uploaded<br>**When** processing begins<br>**Then** the Celery worker uses FFmpeg to extract a normalized WAV file. | P0 |
| **FR-022** | ASR Execution | The system transcribes audio using Whisper. | **Given** an extracted audio file<br>**When** passed to the Whisper module<br>**Then** a JSON array of transcript segments with timestamps is returned. | P0 |
| **FR-023** | Chunking Strategy | Audio > 10m is chunked for memory safety. | **Given** a 60-minute audio file<br>**When** transcription begins<br>**Then** the system processes it in 10-minute overlapping chunks. | P0 |
| **FR-024** | LLM Summarization | The system generates a summary from the transcript. | **Given** a complete transcript<br>**When** passed to the LLM pipeline<br>**Then** a markdown summary is generated and saved to the database. | P0 |
| **FR-025** | Action Extraction | The system identifies actionable tasks. | **Given** a transcript containing commitments<br>**When** analyzed by the LLM<br>**Then** discrete Action Item records are created in the DB. | P0 |

## 4. Search & RAG (FR-041 to FR-050)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-041** | Vector Generation | Transcripts are embedded for search. | **Given** a new transcript<br>**When** processing finishes<br>**Then** the text is chunked, embedded, and stored in pgvector. | P0 |
| **FR-042** | Semantic Query | Users can search via natural language. | **Given** a user types a question in AI search<br>**When** they submit<br>**Then** the system retrieves the top 5 most relevant chunks via Cosine Similarity. | P0 |
| **FR-043** | RAG Answer | The system generates answers based on context. | **Given** retrieved chunks from FR-042<br>**When** passed to the LLM<br>**Then** an answer is streamed back to the user interface. | P0 |
| **FR-044** | Citations | RAG answers include source links. | **Given** a generated RAG answer<br>**When** the user clicks a [1] citation<br>**Then** they are navigated to the exact meeting and timestamp. | P1 |

## 5. User Interface (FR-051 to FR-060)

| ID | Title | Description | Acceptance Criteria | Priority |
|---|---|---|---|---|
| **FR-051** | Dashboard Feed | Users see recent meetings. | **Given** a logged-in user<br>**When** they visit /dashboard<br>**Then** they see a chronological list of the last 10 meetings. | P0 |
| **FR-052** | Action Item Tracker | Users can manage their tasks. | **Given** a user has assigned action items<br>**When** they visit the Actions page<br>**Then** they can mark items as complete or edit them. | P0 |
| **FR-053** | Transcript Viewer | The UI displays the transcript readably. | **Given** a processed meeting<br>**When** the user opens the Transcript tab<br>**Then** they see text organized by speaker and timestamp. | P0 |
