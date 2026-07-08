---
Title: MeetingMind — API Requirements
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-07-08
Dependencies: 01-product/prd.md
Related Documents:
  - 02-engineering/api-design.md
  - 02-engineering/jira-api-contracts.md
  - 04-backend/api-specification.md
---

# MeetingMind — API Requirements

This document defines the overarching requirements, constraints, and conventions for the MeetingMind REST API (FastAPI backend).

## 1. Architectural Style
* The API must strictly adhere to **RESTful** design principles.
* Resources should be modeled as nouns (e.g., `/meetings`, `/users`, `/action-items`).
* Actions that do not map neatly to CRUD should use sub-resources or query parameters (e.g., `/meetings/{id}/process`).

## 2. Versioning Strategy
* The API must be versioned in the URL path (e.g., `/api/v1/`).
* Breaking changes require a new version integer (e.g., `/api/v2/`). Non-breaking changes (adding fields) apply to the current version.

## 3. Request & Response Formats
* **Content-Type:** `application/json` is the standard for both requests and responses.
* **WebSocket Audio:** Chrome extension and fallback web capture use authenticated WebSocket/WebRTC audio chunks rather than REST file upload.
* **Multipart Form Data:** Required only for recording imports when presigned direct-to-MinIO uploads are not available.
* **Casing:** Request and response JSON payloads must use `snake_case` to align with Python/PostgreSQL paradigms. The frontend will handle transformation to `camelCase` if necessary.

## 4. Authentication & Authorization
* **Bearer Token:** The API must accept JWTs via the `Authorization: Bearer <token>` header.
* **Workspace Scoping:** Workspace collection routes must carry workspace context in the URL path, for example `/api/v1/workspaces/{workspace_id}/meetings`. Meeting child routes such as `/api/v1/meetings/{meeting_id}/transcript` must derive workspace context from the meeting record and then verify membership. Do not use `X-Workspace-ID` as the primary authorization boundary.
* **RBAC Enforcement:** The API must reject requests with `403 Forbidden` if the user's role in the specified workspace lacks the necessary permissions.

## 5. Standard Status Codes
The API must use appropriate HTTP status codes:
* `200 OK`: Successful GET, PUT, PATCH.
* `201 Created`: Successful POST (must include the created resource).
* `204 No Content`: Successful DELETE.
* `400 Bad Request`: Malformed JSON or invalid parameters.
* `401 Unauthorized`: Missing or invalid JWT.
* `403 Forbidden`: Valid JWT, but insufficient permissions.
* `404 Not Found`: Resource does not exist.
* `409 Conflict`: Resource state conflict (e.g., trying to register an existing email).
* `422 Unprocessable Entity`: Pydantic validation failure.
* `429 Too Many Requests`: Rate limit exceeded.
* `500 Internal Server Error`: Unhandled exception.

## 6. Error Handling
* All errors (4xx and 5xx) MUST return an RFC 7807 "Problem Details" JSON object:
  ```json
  {
    "type": "https://api.meetingmind.io/errors/validation",
    "title": "Validation Error",
    "status": 422,
    "detail": "The 'password' field must contain at least one number.",
    "instance": "/api/v1/auth/register"
  }
  ```

## 7. Pagination, Filtering, and Sorting
* **Pagination:** Must use cursor-based pagination for large collections to avoid offset-limit performance penalties.
  * Request: `?cursor=abc123z&limit=50`
  * Response envelope: `{ "data": [...], "meta": { "next_cursor": "def456y", "has_more": true, "limit": 50 } }`
* **Filtering:** Use bracket notation: `?filter[status]=completed`.
* **Sorting:** Use prefix notation: `?sort=-created_at` (descending) or `?sort=title` (ascending).

## 8. Rate Limiting
* Global Rate Limit: 100 requests per minute per user.
* RAG Search Limit: 10 requests per minute per user (due to LLM compute costs).
* Headers: The API must return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

## 9. OpenAPI Specification
* The backend must auto-generate an OpenAPI 3.1 schema.
* The `/docs` endpoint (Swagger UI) must be accessible in development, but secured or disabled in production.
* Every endpoint must have a summary, description, and strongly-typed response models for 2xx and 4xx status codes.
