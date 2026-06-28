---
Title: MeetingMind — Backend: API Specification
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/database-schema.md
---

# MeetingMind Backend: API Specification

## 1. Overview
MeetingMind utilizes a RESTful API built with FastAPI (Python). FastAPI provides automatic OpenAPI (Swagger) documentation. This document outlines the core domain routes and design patterns.

## 2. API Design Principles
* **Base URL:** `/api/v1`
* **Content Type:** `application/json` (except for file uploads).
* **Authentication:** Bearer token (JWT) in the `Authorization` header.
* **Pagination:** Limit/Offset pattern (e.g., `?limit=20&offset=0`).
* **Error Handling:** Standardized JSON error responses following RFC 7807 (Problem Details).

## 3. Standard Response Formats

### Success
```json
{
  "data": { ... },
  "meta": { "total_count": 45, "limit": 20 } // Optional, for lists
}
```

### Error
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested meeting does not exist.",
    "details": {}
  }
}
```

## 4. Core Endpoints

### 4.1 Authentication (`/auth`)
Handled via OAuth2 (e.g., Google/Microsoft) or Email/Password, issuing JWTs.
* `POST /auth/login`
* `POST /auth/refresh`
* `GET /auth/me` -> Returns current user and their accessible workspaces.

### 4.2 Workspaces (`/workspaces`)
* `GET /workspaces` -> List user's workspaces.
* `GET /workspaces/{id}`
* `POST /workspaces`
* `GET /workspaces/{id}/members`

### 4.3 Meetings (`/workspaces/{workspace_id}/meetings`)
*Notice: Meetings are nested under workspaces for explicit multi-tenant routing.*

* `GET /workspaces/{wid}/meetings` -> List meetings (supports query params `?status=completed&sort=-date`).
* `GET /workspaces/{wid}/meetings/{id}` -> Get detailed meeting (includes summary).
* `POST /workspaces/{wid}/meetings/upload` -> Multipart form-data for uploading raw audio. Returns an upload task ID.
* `DELETE /workspaces/{wid}/meetings/{id}` -> Soft delete.

### 4.4 Meeting Data (`/meetings/{meeting_id}/*`)
For accessing the nested resources of a specific meeting. (Can omit workspace ID in path if the backend checks the meeting's workspace ownership against the user's JWT).

* `GET /meetings/{id}/transcript` -> Returns the list of `TranscriptSegments`.
* `GET /meetings/{id}/action-items`
* `PATCH /meetings/{id}/action-items/{item_id}` -> E.g., marking complete.
* `GET /meetings/{id}/decisions`

### 4.5 AI & RAG (`/workspaces/{workspace_id}/ai`)
* `POST /workspaces/{wid}/ai/chat` 
  * **Payload:** `{ "query": "What was the budget for Q3?", "meeting_ids": ["uuid-1", "uuid-2"] }`
  * **Response:** Server-Sent Events (SSE) stream for real-time text generation, OR a JSON response if streaming is disabled.

## 5. File Upload Strategy
FastAPI can handle `UploadFile`, but for large meeting recordings (1GB+):
1. Client requests a Presigned URL: `POST /meetings/presigned-url`
2. Backend returns an S3/Cloud Storage URL.
3. Client uses `PUT` to upload the file directly to the storage bucket.
4. Client notifies Backend of success: `POST /meetings/upload-complete`
5. Backend triggers Celery pipeline.

## 6. Websockets / Polling
For tracking the AI Processing pipeline (`status` changing from `uploading` -> `transcribing` -> `completed`):
* Prefer a WebSocket connection: `WS /ws/meetings/{id}/status`
* Fallback to HTTP Polling: `GET /meetings/{id}/status`

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
