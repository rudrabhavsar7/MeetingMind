---
Title: MeetingMind - Engineering: Jira API Implementation Contracts
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-08
Dependencies: 02-engineering/jira-tickets.md, 04-backend/api-specification.md
Related Documents:
  - 01-product/api-requirements.md
  - 02-engineering/api-design.md
  - 02-engineering/error-handling.md
  - 02-engineering/authorization.md
  - 04-backend/database-schema.md
---

# MeetingMind: Jira API Implementation Contracts

This document exists so implementation agents do not need to infer API behavior from scattered prose. It expands the API-owning Jira tickets into endpoint-level contracts. If a ticket touches one of these endpoints, the ticket is not complete until the matching contract, authorization rule, response model, error behavior, and tests are implemented.

## Global API Rules

- Base path is `/api/v1` except root health (`/health`) and local development docs (`/docs`).
- JSON uses `snake_case` for requests and responses.
- All public identifiers are UUID strings.
- Dates and timestamps use ISO 8601 UTC strings unless a field explicitly says seconds-from-meeting-start.
- Successful JSON responses use `{"data": ...}` for single resources and `{"data": [...], "meta": {"next_cursor": "...", "has_more": true, "limit": 50}}` for cursor-paginated lists.
- Error responses use RFC 7807 Problem Details directly at the top level: `type`, `title`, `status`, `detail`, `instance`. Validation errors may add an `errors` array.
- Workspace-scoped routes must derive authorization from the authenticated user and database membership, never from a role submitted by the client.
- Default role rules come from `02-engineering/authorization.md`.
- All tenant-scoped database queries must filter by `workspace_id` directly or through a meeting lookup that verifies the meeting belongs to an authorized workspace.
- List endpoints default to `limit=50`, cap `limit` at 100, and use opaque cursors.
- LLM, STT, diarization, and embedding providers are local by default. External providers require explicit operator opt-in and are out of scope unless a ticket says otherwise.

## Shared Schemas

### ProblemDetails

```json
{
  "type": "https://api.meetingmind.io/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Meeting was not found in this workspace.",
  "instance": "/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}"
}
```

### ValidationErrorItem

```json
{
  "field": "password",
  "message": "Password must contain at least one number.",
  "code": "password_missing_number"
}
```

### WorkspaceSummary

```json
{
  "id": "uuid",
  "name": "Engineering",
  "slug": "engineering",
  "role": "owner"
}
```

### MeetingSummary

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "title": "Sprint Planning",
  "status": "recording",
  "source_type": "extension_capture",
  "source_app": "google_meet",
  "source_url": "https://meet.google.com/abc-defg-hij",
  "source_title": "Sprint Planning - Google Meet",
  "started_at": "2026-07-08T09:00:00Z",
  "ended_at": null,
  "duration_seconds": null,
  "created_by_user_id": "uuid",
  "participant_count": 6,
  "summary_preview": null
}
```

### TranscriptSegment

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "meeting_id": "uuid",
  "speaker_label": "Speaker 1",
  "speaker_name": null,
  "start_time": 14.22,
  "end_time": 18.74,
  "sequence_number": 12,
  "text": "We should ship the extension capture flow first.",
  "is_final": true
}
```

### Citation

```json
{
  "meeting_id": "uuid",
  "meeting_title": "Sprint Planning",
  "segment_id": "uuid",
  "start_time": 14.22,
  "end_time": 18.74,
  "speaker_label": "Speaker 1",
  "text_excerpt": "We should ship the extension capture flow first."
}
```

## MM-103: Health and OpenAPI

### `GET /health`

Purpose: root service health for load balancers and local smoke checks.

Auth: none.

Response `200`:

```json
{
  "status": "ok",
  "service": "MeetingMind API"
}
```

Tests:

- Returns `200` without authentication.
- Includes `X-Request-ID` and `X-Process-Time` headers.

### `GET /api/v1/health`

Purpose: versioned API health.

Auth: none.

Response `200`:

```json
{
  "status": "ok",
  "service": "MeetingMind API"
}
```

Tests:

- Returns `200` without authentication.
- Response model is included in OpenAPI.

## MM-203: Authentication API

### `POST /auth/register`

Purpose: create an email/password user, create or attach the user to a default workspace, return an access token, and set a refresh cookie.

Auth: none.

Request:

```json
{
  "email": "maya@example.com",
  "full_name": "Maya Chen",
  "password": "SecurePass123"
}
```

Validation:

- `email`: required, valid email, normalized to lowercase.
- `full_name`: required, 1-255 characters.
- `password`: required, 8-128 characters, at least one number.

Response `201`:

```json
{
  "data": {
    "access_token": "jwt",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "maya@example.com",
      "full_name": "Maya Chen",
      "workspaces": [
        {
          "id": "uuid",
          "name": "Maya's Workspace",
          "slug": "mayas-workspace",
          "role": "owner"
        }
      ]
    }
  }
}
```

Cookies:

- Sets `refresh_token`.
- `HttpOnly=true`.
- `Secure=true` in production.
- `SameSite=Lax`.
- Max age is 7 days.

Errors:

- `409` if email already exists.
- `422` for validation failure.

Tests:

- Successful registration hashes password and never returns `password_hash`.
- Duplicate email returns `409`.
- Refresh cookie is present and has secure production settings.
- User is owner of a default workspace unless a later invite/bootstrap flow explicitly changes this behavior.

### `POST /auth/login`

Purpose: authenticate an existing user and rotate refresh credentials.

Auth: none.

Request:

```json
{
  "email": "maya@example.com",
  "password": "SecurePass123"
}
```

Response `200`: same envelope as register.

Errors:

- `401` for invalid credentials.
- `422` for malformed payload.

Tests:

- Valid credentials return a bearer access token.
- Invalid credentials return `401` without revealing whether the email exists.
- Refresh cookie is rotated on each successful login.

### `POST /auth/refresh`

Purpose: rotate a valid refresh token and issue a new access token.

Auth: `refresh_token` HttpOnly cookie.

Request body: none.

Response `200`: same envelope as login.

Errors:

- `401` if cookie is missing, expired, revoked, or invalid.

Tests:

- Valid refresh token is revoked and replaced.
- Reusing an old rotated token returns `401`.

### `POST /auth/logout`

Purpose: revoke refresh token and clear cookie.

Auth: optional `refresh_token` cookie.

Response `200`:

```json
{
  "data": {
    "status": "ok"
  }
}
```

Tests:

- Existing refresh token is revoked.
- Missing refresh token still clears cookie and returns `200`.

### `GET /auth/me`

Purpose: return the authenticated user and accessible workspaces.

Auth: bearer access token.

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "email": "maya@example.com",
    "full_name": "Maya Chen",
    "workspaces": [
      {
        "id": "uuid",
        "name": "Engineering",
        "slug": "engineering",
        "role": "owner"
      }
    ]
  }
}
```

Errors:

- `401` for missing, expired, malformed, or invalid bearer token.

Tests:

- Requires bearer token.
- Returns only workspaces where the user has active membership.

## MM-205: Workspace and Membership API

### `GET /workspaces`

Purpose: list workspaces available to the current user.

Auth: bearer token.

Response `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "slug": "engineering",
      "role": "owner"
    }
  ]
}
```

Tests:

- User sees only active memberships.
- Soft-deleted workspaces are excluded.

### `POST /workspaces`

Purpose: create a workspace and owner membership for the current user.

Auth: bearer token.

Request:

```json
{
  "name": "Engineering",
  "slug": "engineering"
}
```

Response `201`: `WorkspaceSummary`.

Errors:

- `409` if slug is already used.
- `422` for invalid slug or name.

Tests:

- Creator receives `owner` role.
- Slug uniqueness is enforced.

### `GET /workspaces/{workspace_id}`

Purpose: read workspace settings and user role.

Auth: bearer token plus workspace membership.

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "slug": "engineering",
    "role": "owner",
    "settings": {},
    "raw_audio_retention_days": null,
    "created_at": "2026-07-08T09:00:00Z"
  }
}
```

Errors:

- `403` for non-member.
- `404` for unknown or deleted workspace.

### `PATCH /workspaces/{workspace_id}`

Purpose: update workspace settings.

Auth: owner or admin.

Request:

```json
{
  "name": "Engineering Platform",
  "raw_audio_retention_days": 30,
  "settings": {
    "default_capture_source": "extension_capture"
  }
}
```

Response `200`: updated workspace details.

Tests:

- Member/viewer receives `403`.
- `raw_audio_retention_days=null` means raw live audio is not retained by default.

### `GET /workspaces/{workspace_id}/members`

Purpose: list workspace members.

Auth: workspace member.

Response `200` list item:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "email": "maya@example.com",
  "full_name": "Maya Chen",
  "role": "owner",
  "created_at": "2026-07-08T09:00:00Z"
}
```

### `POST /workspaces/{workspace_id}/members`

Purpose: invite or add a member.

Auth: owner or admin.

Request:

```json
{
  "email": "sarah@example.com",
  "role": "member"
}
```

Response `201`: membership or pending invite representation.

Tests:

- Member/viewer cannot invite.
- Role must be one of `admin`, `member`, `viewer`.

### `PATCH /workspaces/{workspace_id}/members/{user_id}`

Purpose: change a member role.

Auth: owner or admin. Only owner can grant or remove owner role.

Request:

```json
{
  "role": "viewer"
}
```

Response `200`: updated membership.

Tests:

- Last owner cannot be downgraded.
- Admin cannot promote another user to owner.

### `DELETE /workspaces/{workspace_id}/members/{user_id}`

Purpose: remove a member.

Auth: owner or admin. Only owner can remove an owner.

Response `204`: no body.

Tests:

- Last owner cannot be removed.
- Removed user immediately loses workspace access.

## MM-302: Extension Connection and Live Session API

### `POST /extension/connect`

Purpose: exchange the logged-in web session for a short-lived extension token.

Auth: bearer token.

Request:

```json
{
  "workspace_id": "uuid",
  "extension_version": "1.0.0",
  "browser": "chrome",
  "permissions_granted": ["tabCapture", "activeTab"]
}
```

Response `200`:

```json
{
  "data": {
    "extension_token": "opaque-token",
    "expires_at": "2026-07-08T09:15:00Z",
    "workspace": {
      "id": "uuid",
      "name": "Engineering",
      "slug": "engineering",
      "role": "member"
    },
    "event_schema_version": "1.0"
  }
}
```

Errors:

- `403` if user is not a workspace member.
- `422` for unsupported browser or malformed permissions list.

Tests:

- Token is scoped to user and workspace.
- Token expiry is short-lived and enforced by stream/session endpoints.

### `GET /extension/capabilities?workspace_id={workspace_id}`

Purpose: return capture capabilities, rollout flags, and retention policy for the extension UI.

Auth: bearer token or valid extension token.

Response `200`:

```json
{
  "data": {
    "supported_apps": ["google_meet"],
    "fast_follow_apps": ["zoom_web", "teams_web"],
    "audio_chunk_ms": {
      "min": 250,
      "max": 500,
      "recommended": 500
    },
    "raw_audio_retention_days": null,
    "standalone_web_capture_enabled": true,
    "recording_import_enabled": true,
    "event_schema_version": "1.0"
  }
}
```

Tests:

- Non-member receives `403`.
- `raw_audio_retention_days` matches workspace policy.

### `POST /extension/heartbeat`

Purpose: persist connection state and active tab context for support/debugging.

Auth: valid extension token.

Request:

```json
{
  "workspace_id": "uuid",
  "active_tab": {
    "source_app": "google_meet",
    "source_url": "https://meet.google.com/abc-defg-hij",
    "source_title": "Sprint Planning - Google Meet",
    "is_supported": true
  },
  "status": "ready"
}
```

Response `200`:

```json
{
  "data": {
    "status": "ok",
    "server_time": "2026-07-08T09:00:00Z"
  }
}
```

Tests:

- Expired extension token returns `401`.
- Heartbeat does not create a meeting.

### `POST /workspaces/{workspace_id}/meetings/live`

Purpose: create an extension or standalone live capture meeting session.

Auth: bearer token or valid extension token. Required role: owner, admin, or member.

Request:

```json
{
  "client_type": "chrome_extension",
  "source_type": "extension_capture",
  "source_app": "google_meet",
  "source_url": "https://meet.google.com/abc-defg-hij",
  "source_title": "Sprint Planning - Google Meet",
  "visible_participants": [
    {
      "display_name": "Maya Chen",
      "source_id": null
    }
  ],
  "started_at": "2026-07-08T09:00:00Z"
}
```

Validation:

- `client_type`: `chrome_extension` or `web_console`.
- `source_type`: `extension_capture` or `standalone_web_capture`.
- `source_app`: `google_meet`, `zoom_web`, `teams_web`, or `standalone_web`.
- `source_url`: required for extension capture when available from the tab.
- `visible_participants`: optional array. Treat names as untrusted user-visible metadata.

Response `201`:

```json
{
  "data": {
    "meeting": {
      "id": "uuid",
      "workspace_id": "uuid",
      "title": "Sprint Planning - Google Meet",
      "status": "recording",
      "source_type": "extension_capture",
      "source_app": "google_meet",
      "started_at": "2026-07-08T09:00:00Z"
    },
    "stream_url": "wss://host/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/stream",
    "stream_token": "opaque-token",
    "stream_token_expires_at": "2026-07-08T09:15:00Z",
    "event_schema_version": "1.0"
  }
}
```

Errors:

- `403` for viewer or non-member.
- `409` if the same client already has an active stream for the same meeting URL and workspace.
- `422` for unsupported source app or source type.

Tests:

- Creates `Meeting.status=recording`.
- Persists source metadata exactly as received after validation/sanitization.
- Stream token is bound to meeting, workspace, and user.

### `POST /workspaces/{workspace_id}/meetings/{meeting_id}/end`

Purpose: end a live capture session and move the meeting toward final processing.

Auth: bearer token or stream/extension token for the same meeting. Required role: owner, admin, member, or original stream owner.

Request:

```json
{
  "ended_at": "2026-07-08T10:00:00Z",
  "reason": "user_stopped"
}
```

Response `200`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "status": "analyzing",
    "ended_at": "2026-07-08T10:00:00Z"
  }
}
```

Tests:

- Cannot end a meeting outside the workspace.
- Idempotent repeated end requests return the current terminal or processing state.

## MM-402 and MM-405: Live Stream and Status Events

### `WS /workspaces/{workspace_id}/meetings/{meeting_id}/stream`

Purpose: authenticated live audio stream and bidirectional event channel for extension or standalone capture.

Auth: `stream_token` in the WebSocket query string or `Sec-WebSocket-Protocol`. Token must be bound to the workspace and meeting.

Client binary messages:

- 250-500ms audio chunk.
- PCM 16 kHz mono is the default normalized target.
- Each binary frame must be preceded by or paired with metadata.

Client metadata message:

```json
{
  "type": "audio_chunk",
  "sequence_number": 42,
  "started_at_ms": 20500,
  "duration_ms": 500,
  "mime_type": "audio/pcm",
  "sample_rate_hz": 16000
}
```

Server event examples:

```json
{
  "type": "transcript_interim",
  "meeting_id": "uuid",
  "sequence_number": 42,
  "speaker_label": "Speaker 1",
  "start_time": 20.5,
  "end_time": 21.0,
  "text": "Let's confirm the",
  "is_final": false
}
```

```json
{
  "type": "transcript_final",
  "meeting_id": "uuid",
  "segment": {
    "id": "uuid",
    "speaker_label": "Speaker 1",
    "speaker_name": null,
    "start_time": 20.5,
    "end_time": 24.8,
    "sequence_number": 42,
    "text": "Let's confirm the extension-first capture scope.",
    "is_final": true
  }
}
```

```json
{
  "type": "summary_updated",
  "meeting_id": "uuid",
  "summary": "The team confirmed extension-first capture for v1.",
  "citations": [
    {
      "segment_id": "uuid",
      "start_time": 20.5,
      "end_time": 24.8
    }
  ]
}
```

```json
{
  "type": "error",
  "code": "out_of_order_chunk",
  "message": "Audio chunk sequence was older than the current stream cursor.",
  "recoverable": true
}
```

Close behavior:

- Invalid token: close with policy violation code and do not create transcript data.
- Closed or failed meeting: close with readable error event first when possible.
- Recoverable network reconnect: client may reconnect with same meeting while token is valid.

Tests:

- Rejects invalid or expired stream tokens.
- Rejects oversized chunks.
- Handles duplicate and out-of-order chunks without corrupting transcript sequence.
- Persists final transcript segments with workspace ID.

### `WS /ws/meetings/{meeting_id}/status`

Purpose: status/event stream for console views that are not sending audio.

Auth: bearer token. User must be a member of the meeting workspace.

Server event:

```json
{
  "type": "meeting_status",
  "meeting_id": "uuid",
  "status": "transcribing",
  "progress": {
    "stage": "stt",
    "percent": 42
  },
  "updated_at": "2026-07-08T09:10:00Z"
}
```

### `GET /meetings/{meeting_id}/status`

Purpose: HTTP polling fallback for processing status.

Auth: bearer token. User must be a member of the meeting workspace.

Response `200`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "status": "analyzing",
    "progress": {
      "stage": "llm_summary",
      "percent": 70
    },
    "last_error": null,
    "updated_at": "2026-07-08T09:20:00Z"
  }
}
```

## MM-305: Recording Import API

### `POST /workspaces/{workspace_id}/meetings/import/presigned-url`

Purpose: validate an import request and return a short-lived object-storage PUT URL.

Auth: bearer token. Required role: owner, admin, or member.

Request:

```json
{
  "filename": "q3-planning.mp4",
  "mime_type": "video/mp4",
  "file_size_bytes": 104857600,
  "title": "Q3 Planning"
}
```

Validation:

- Allowed extensions and MIME types: MP3, MP4, WAV, M4A, WebM.
- Maximum size: 2 GB.
- Filename is sanitized before object key generation.

Response `201`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "upload_url": "https://minio.local/presigned-put",
    "object_key": "workspaces/{workspace_id}/meetings/{meeting_id}/imports/q3-planning.mp4",
    "expires_at": "2026-07-08T09:15:00Z",
    "required_headers": {
      "Content-Type": "video/mp4"
    }
  }
}
```

Tests:

- Viewer and non-member receive `403`.
- Oversized files return `422`.
- Object key is scoped by workspace and meeting.

### `POST /workspaces/{workspace_id}/meetings/import-complete`

Purpose: confirm upload completion and queue batch processing.

Auth: bearer token. Required role: owner, admin, or member.

Request:

```json
{
  "meeting_id": "uuid",
  "object_key": "workspaces/{workspace_id}/meetings/{meeting_id}/imports/q3-planning.mp4",
  "etag": "object-storage-etag"
}
```

Response `202`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "status": "transcribing",
    "queued_task_id": "celery-task-id"
  }
}
```

Tests:

- Confirms object exists before queueing.
- Rejects object keys outside the workspace/meeting prefix.
- Repeated calls do not enqueue duplicate active processing tasks.

## MM-501: Meetings API

### `GET /workspaces/{workspace_id}/meetings`

Purpose: list workspace meetings for dashboard and meeting list.

Auth: workspace member.

Query:

- `cursor`: optional opaque cursor.
- `limit`: optional, default 50, max 100.
- `filter[status]`: optional meeting status.
- `filter[source_type]`: optional source type.
- `sort`: `-started_at` default, or `title`, `started_at`, `created_at`.

Response `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "title": "Sprint Planning",
      "status": "completed",
      "source_type": "extension_capture",
      "source_app": "google_meet",
      "started_at": "2026-07-08T09:00:00Z",
      "ended_at": "2026-07-08T10:00:00Z",
      "duration_seconds": 3600,
      "participant_count": 6,
      "summary_preview": "The team agreed to..."
    }
  ],
  "meta": {
    "next_cursor": null,
    "has_more": false,
    "limit": 50
  }
}
```

Tests:

- Excludes soft-deleted meetings.
- Cursor pagination is stable with duplicate timestamps.
- Cross-workspace meetings are never returned.

### `GET /workspaces/{workspace_id}/meetings/{meeting_id}`

Purpose: get meeting details and summary shell.

Auth: workspace member.

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "workspace_id": "uuid",
    "title": "Sprint Planning",
    "status": "completed",
    "source_type": "extension_capture",
    "source_app": "google_meet",
    "source_url": "https://meet.google.com/abc-defg-hij",
    "source_title": "Sprint Planning - Google Meet",
    "visible_participants": [],
    "summary": "The team agreed to...",
    "started_at": "2026-07-08T09:00:00Z",
    "ended_at": "2026-07-08T10:00:00Z",
    "duration_seconds": 3600,
    "raw_audio_retained": false,
    "created_by_user_id": "uuid"
  }
}
```

Errors:

- `404` if meeting is missing, deleted, or not in the workspace.

### `DELETE /workspaces/{workspace_id}/meetings/{meeting_id}`

Purpose: soft-delete a meeting.

Auth: owner or admin.

Response `204`: no body.

Tests:

- Member/viewer receive `403`.
- Soft-deleted meeting disappears from list and detail endpoints.

## MM-502: Action Items and Decisions API

### `GET /meetings/{meeting_id}/action-items`

Purpose: list action items for an authorized meeting.

Auth: workspace member through meeting lookup.

Query:

- `filter[status]`: `open` or `completed`.

Response item:

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "meeting_id": "uuid",
  "source_segment_id": "uuid",
  "text": "Follow up on extension token expiry handling.",
  "assignee_name": "Rudra",
  "due_date": null,
  "status": "open",
  "citation": {
    "segment_id": "uuid",
    "start_time": 114.2,
    "end_time": 118.6
  }
}
```

### `PATCH /meetings/{meeting_id}/action-items/{item_id}`

Purpose: update user-editable action item fields.

Auth: owner, admin, or member.

Request:

```json
{
  "text": "Follow up on stream token expiry handling.",
  "assignee_name": "Rudra",
  "due_date": "2026-07-10T00:00:00Z",
  "status": "completed"
}
```

Response `200`: updated action item.

Tests:

- Viewer receives `403`.
- `item_id` must belong to `meeting_id`.

### `GET /meetings/{meeting_id}/decisions`

Purpose: list extracted decisions for an authorized meeting.

Auth: workspace member through meeting lookup.

Response item:

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "meeting_id": "uuid",
  "source_segment_id": "uuid",
  "title": "Extension-first capture remains v1 primary",
  "text": "The team confirmed Chrome extension capture is the primary v1 workflow.",
  "rationale": "It meets users inside existing meeting apps and can capture visible metadata.",
  "citation": {
    "segment_id": "uuid",
    "start_time": 20.5,
    "end_time": 24.8
  }
}
```

## MM-503: Transcript API

### `GET /meetings/{meeting_id}/transcript`

Purpose: list transcript segments with cursor or time-range pagination.

Auth: workspace member through meeting lookup.

Query:

- `cursor`: optional opaque cursor.
- `limit`: default 100, max 500.
- `start_time`: optional seconds from meeting start.
- `end_time`: optional seconds from meeting start.

Response `200`: list of `TranscriptSegment`.

Tests:

- Ordered by `sequence_number`, then `start_time`.
- Time filters cannot leak another meeting's segments.

### `PATCH /meetings/{meeting_id}/transcript/speakers/{speaker_label}`

Purpose: map a diarized speaker label to a human-readable speaker name.

Auth: owner, admin, or member.

Request:

```json
{
  "speaker_name": "Maya Chen"
}
```

Response `200`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "speaker_label": "Speaker 1",
    "speaker_name": "Maya Chen",
    "updated_segments": 14
  }
}
```

Tests:

- Updates only segments in the requested meeting.
- Empty `speaker_name` clears the mapping if supported.

### `GET /meetings/{meeting_id}/transcript/search`

Purpose: keyword search within one meeting transcript.

Auth: workspace member through meeting lookup.

Query:

- `q`: required, 2-200 characters.
- `limit`: default 20, max 50.

Response item:

```json
{
  "segment": {
    "id": "uuid",
    "speaker_label": "Speaker 1",
    "speaker_name": "Maya Chen",
    "start_time": 14.22,
    "end_time": 18.74,
    "text": "We should ship extension capture first."
  },
  "highlight_ranges": [
    {
      "start": 15,
      "end": 32
    }
  ]
}
```

## MM-504: Media URL API

### `GET /meetings/{meeting_id}/media-url`

Purpose: return a short-lived signed media URL when raw/imported media is retained and the user is authorized.

Auth: workspace member through meeting lookup.

Response `200`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "media_url": "https://minio.local/presigned-get",
    "expires_at": "2026-07-08T09:15:00Z",
    "content_type": "video/mp4"
  }
}
```

Errors:

- `404` if no retained media exists.
- `403` if workspace policy or role disallows media access.

Tests:

- URL is signed and expires.
- Object key is verified against meeting workspace before signing.

## MM-603: Ask AI API

### `POST /workspaces/{workspace_id}/ai/chat`

Purpose: answer a workspace-scoped natural language question using RAG over processed meeting transcripts.

Auth: workspace member.

Rate limit: 10 requests per minute per user.

Request:

```json
{
  "query": "What did we decide about extension-first capture?",
  "meeting_ids": ["uuid"],
  "top_k": 5,
  "stream": true
}
```

Validation:

- `query`: 3-500 characters.
- `meeting_ids`: optional; if present, every meeting must belong to the workspace.
- `top_k`: default 5, min 1, max 10.
- `stream`: default true.

Non-streaming response `200`:

```json
{
  "data": {
    "answer": "The team decided that Chrome extension capture remains the primary v1 workflow.",
    "citations": [
      {
        "meeting_id": "uuid",
        "meeting_title": "Sprint Planning",
        "segment_id": "uuid",
        "start_time": 20.5,
        "end_time": 24.8,
        "speaker_label": "Speaker 1",
        "text_excerpt": "Chrome extension capture is the primary v1 workflow."
      }
    ],
    "model": "local-ollama",
    "retrieval": {
      "top_k": 5,
      "matched_segments": 3
    }
  }
}
```

Streaming response:

- Content type: `text/event-stream`.
- Events: `message_start`, `token`, `citation`, `message_done`, `error`.

SSE token event:

```text
event: token
data: {"text":"The team decided "}
```

Errors:

- `403` for non-member.
- `404` when a supplied meeting ID is not in the workspace.
- `429` for rate limit.
- `422` for invalid query.

Tests:

- SQL retrieval always filters by `workspace_id`.
- Meeting filter cannot include cross-workspace IDs.
- No relevant context returns a bounded answer rather than hallucinated content.
- Ollama and embedding providers are mocked in deterministic tests.

## MM-605: Citation Resolver API

### `GET /meetings/{meeting_id}/citations/{segment_id}`

Purpose: resolve a citation link to transcript context for UI jump/modals. This endpoint is optional if the frontend already has the segment in cache, but must follow this contract if implemented.

Auth: workspace member through meeting lookup.

Response `200`:

```json
{
  "data": {
    "meeting_id": "uuid",
    "meeting_title": "Sprint Planning",
    "segment": {
      "id": "uuid",
      "speaker_label": "Speaker 1",
      "speaker_name": "Maya Chen",
      "start_time": 20.5,
      "end_time": 24.8,
      "text": "Chrome extension capture is the primary v1 workflow."
    },
    "previous_segment": null,
    "next_segment": null
  }
}
```

Tests:

- `segment_id` must belong to `meeting_id`.
- Cross-workspace citation lookup returns `404` or `403` without leaking existence.

## Ticket-Level API Definition of Done

Every API-owning ticket must include:

- Pydantic request and response schemas with examples in OpenAPI.
- Route summary, description, tags, and typed 2xx response model.
- RFC 7807 responses for expected 4xx errors.
- Unit tests for service-layer branch logic.
- Integration tests for success, validation failure, unauthenticated access, unauthorized workspace access, and not-found behavior.
- Workspace isolation assertion for every tenant-scoped query.
- No real external AI, storage, or email calls in deterministic CI tests.
