---
Title: MeetingMind — Backend: API Specification
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-08
Dependencies: 04-backend/database-schema.md
Related Documents:
  - 01-product/api-requirements.md
  - 02-engineering/api-design.md
  - 02-engineering/jira-api-contracts.md
---

# MeetingMind Backend: API Specification

## 1. Overview
MeetingMind utilizes a RESTful API built with FastAPI (Python). FastAPI provides automatic OpenAPI (Swagger) documentation. This document outlines the core domain routes and design patterns.

## 2. API Design Principles
* **Base URL:** `/api/v1`
* **Content Type:** `application/json` for REST requests, binary or base64 audio chunks for extension live WebSocket streams, and presigned object-storage uploads only for recording imports.
* **Authentication:** Bearer token (JWT) in the `Authorization` header.
* **Pagination:** Cursor-based pagination for large collections (e.g., `?cursor=abc123&limit=50`).
* **Error Handling:** Standardized JSON error responses following RFC 7807 (Problem Details).

## 3. Standard Response Formats

Endpoint-level request and response contracts live in `02-engineering/jira-api-contracts.md`. This API specification defines architecture-level conventions; the Jira API contract document defines implementation-ready payloads, auth rules, error cases, status codes, stream events, and required tests.

### Success
```json
{
  "data": { ... },
  "meta": { "next_cursor": "def456", "has_more": true, "limit": 50 } // Optional, for lists
}
```

### Error
```json
{
  "type": "https://api.meetingmind.io/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "The requested meeting does not exist in this workspace.",
  "instance": "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}"
}
```

Errors must follow RFC 7807 Problem Details directly at the response top level. Do not return a separate `{ "error": ... }` envelope for HTTP API errors. Validation errors may add an `errors` array with field-level details.

## 4. Core Endpoints

The list below is an architectural inventory. Implementers must use `02-engineering/jira-api-contracts.md` for exact payloads and test cases.

### 4.1 Authentication (`/auth`)
Handled through email/password for v1. OAuth providers may be added later as explicit product work. Authentication issues short-lived bearer access tokens and refresh tokens stored as HttpOnly cookies.
* `POST /auth/register`
* `POST /auth/login`
* `POST /auth/refresh`
* `POST /auth/logout`
* `GET /auth/me` -> Returns current user and their accessible workspaces.

### 4.2 Workspaces (`/workspaces`)
* `GET /workspaces` -> List user's workspaces.
* `GET /workspaces/{id}`
* `POST /workspaces`
* `PATCH /workspaces/{id}`
* `GET /workspaces/{id}/members`
* `POST /workspaces/{id}/members`
* `PATCH /workspaces/{id}/members/{user_id}`
* `DELETE /workspaces/{id}/members/{user_id}`

### 4.3 Extension (`/extension`)
* `POST /extension/connect` -> Exchange a logged-in browser session for a short-lived extension token scoped to selected workspaces.
* `GET /extension/capabilities` -> Return supported meeting apps, capture settings, retention policy, and feature flags.
* `POST /extension/heartbeat` -> Maintain extension connection state and current active tab context.

### 4.4 Meetings (`/workspaces/{workspace_id}/meetings`)
*Notice: Meetings are nested under workspaces for explicit multi-tenant routing. Chrome extension capture is the primary v1 ingestion path; recording import and standalone web capture are secondary.*

* `GET /workspaces/{wid}/meetings` -> List meetings (supports query params `?status=completed&sort=-date`).
* `GET /workspaces/{wid}/meetings/{id}` -> Get detailed meeting (includes summary).
* `POST /workspaces/{wid}/meetings/live` -> Create a live capture session and return the meeting/session identifiers. Payload includes `client_type`, `source_app`, `source_url`, `source_title`, and visible participants when available.
* `POST /workspaces/{wid}/meetings/{id}/end` -> End a live capture session and advance the meeting toward final processing.
* `WS /workspaces/{wid}/meetings/{id}/stream` -> WebSocket connection for extension or standalone live audio streaming and real-time STT/extraction events.
* `POST /workspaces/{wid}/meetings/import/presigned-url` -> Generate a presigned upload URL for recording import fallback.
* `POST /workspaces/{wid}/meetings/import-complete` -> Confirm imported recording upload and trigger batch processing.
* `DELETE /workspaces/{wid}/meetings/{id}` -> Soft delete.

### 4.5 Meeting Data (`/meetings/{meeting_id}/*`)
For accessing the nested resources of a specific meeting. (Can omit workspace ID in path if the backend checks the meeting's workspace ownership against the user's JWT).

* `GET /meetings/{id}/transcript` -> Returns the list of `TranscriptSegments`.
* `PATCH /meetings/{id}/transcript/speakers/{speaker_label}` -> Rename or map diarized speaker labels.
* `GET /meetings/{id}/transcript/search` -> Search inside a single meeting transcript.
* `GET /meetings/{id}/action-items`
* `PATCH /meetings/{id}/action-items/{item_id}` -> E.g., marking complete.
* `GET /meetings/{id}/decisions`
* `GET /meetings/{id}/media-url` -> Return a signed media URL when retained media exists and policy allows access.
* `GET /meetings/{id}/status` -> HTTP polling fallback for processing status.

### 4.6 AI & RAG (`/workspaces/{workspace_id}/ai`)
* `POST /workspaces/{wid}/ai/chat` 
  * **Payload:** `{ "query": "What was the budget for Q3?", "meeting_ids": ["uuid-1", "uuid-2"] }`
  * **Response:** Server-Sent Events (SSE) stream for real-time text generation, OR a JSON response if streaming is disabled.
* `GET /meetings/{meeting_id}/citations/{segment_id}` -> Optional citation resolver for transcript jump targets when the frontend does not already have the cited segment cached.

## 5. Extension Capture Strategy
The primary ingestion path is Chrome extension capture:
1. User joins a supported meeting app page, starting with Google Meet.
2. Extension detects the active meeting and requests explicit user action to start capture.
3. Extension creates a live meeting session: `POST /workspaces/{wid}/meetings/live`.
4. Extension opens `WS /workspaces/{wid}/meetings/{id}/stream`.
5. Extension sends 250-500ms PCM audio chunks captured from the meeting tab.
6. Extension sends available meeting context: source app, URL, visible title, start/end time, and visible participants where accessible.
7. Backend emits `transcript_interim`, `transcript_final`, `action_item_detected`, `summary_updated`, and `meeting_completed` events.
8. Final transcript segments, action items, decisions, and embeddings are persisted incrementally.

## 5.1 Standalone Web Capture Strategy
The MeetingMind console may use the same `/meetings/live` and WebSocket stream endpoints for unsupported meeting apps. This is a fallback path, not the primary v1 experience.

## 5.2 Recording Import Strategy
FastAPI can handle `UploadFile`, but for large recording imports (1GB+):
1. Client requests a Presigned URL: `POST /workspaces/{wid}/meetings/import/presigned-url`
2. Backend returns an S3/Cloud Storage URL.
3. Client uses `PUT` to upload the file directly to the storage bucket.
4. Client notifies Backend of success: `POST /workspaces/{wid}/meetings/import-complete`
5. Backend triggers the Celery batch pipeline.

## 6. Websockets

### 6.1 Status Tracking
For tracking live and imported meeting processing (`status` changing from `recording` -> `transcribing` -> `analyzing` -> `completed`):
* Prefer the live stream WebSocket for active sessions.
* For non-active views, use `WS /ws/meetings/{id}/status`.
* Fallback to HTTP Polling: `GET /meetings/{id}/status`

### 6.2 Live Streaming Mode
For real-time meeting processing:
* Connection: `WS /workspaces/{wid}/meetings/{id}/stream`
* Client Payload: Binary PCM audio chunks.
* Server Payload: JSON events for `transcript_interim`, `transcript_final`, `action_item_detected`, and `summary_updated`.

## 7. Rate Limiting
* General API: 100 req/min per IP.
* LLM Endpoints (`/ai/chat`): 10 req/min per user (LLM calls are expensive).
* Implemented using FastAPI middleware (e.g., `slowapi`).

## 8. Validation
All request bodies and query parameters MUST be validated using Pydantic models. FastAPI handles this natively.

Example Pydantic Model:
```python
from pydantic import BaseModel, Field

class ChatQuery(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    meeting_ids: list[str] | None = None
```

## 9. API Versioning
Include the version in the URL path (`/v1/`). When breaking changes are required, bump to `/v2/` rather than relying on custom headers.
