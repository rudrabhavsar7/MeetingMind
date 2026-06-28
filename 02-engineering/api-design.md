---
Title: MeetingMind — API Design Standards
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-06-28
Dependencies: 01-product/api-requirements.md
---

# MeetingMind — API Design Standards

This document translates the high-level API requirements into concrete design patterns and code examples for the FastAPI backend.

## 1. Resource Naming & HTTP Methods

| Method | Collection (`/meetings`) | Item (`/meetings/{id}`) |
|---|---|---|
| **GET** | List items (Pagination required) | Get single item |
| **POST** | Create a new item | *Method Not Allowed* |
| **PUT** | *Method Not Allowed* | Replace entirely (rarely used) |
| **PATCH** | *Method Not Allowed* | Partial update |
| **DELETE** | *Method Not Allowed* | Delete the item |

**Nested Resources:** Use nesting only for dependent resources.
`GET /api/v1/meetings/{id}/action-items`

## 2. Response Envelopes

To maintain consistency, all successful JSON responses must be wrapped in a standard envelope.

### List Response (Pagination)
```json
{
  "data": [
    { "id": "m_123", "title": "Sync" }
  ],
  "meta": {
    "next_cursor": "m_124",
    "has_more": true
  }
}
```

### Single Resource Response
```json
{
  "data": {
    "id": "m_123",
    "title": "Sync"
  }
}
```

## 3. Error Responses (RFC 7807)

FastAPI's default validation error format is non-standard. We override it to return Problem Details.

```json
{
  "type": "https://api.meetingmind.io/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Meeting 'm_999' does not exist in this workspace.",
  "instance": "/api/v1/meetings/m_999"
}
```

## 4. FastAPI Implementation Examples

### 4.1 Route Definition (FastAPI)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.meeting import MeetingResponse, MeetingUpdate
from app.api.dependencies import get_db, get_workspace

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])

@router.patch("/{meeting_id}", response_model=dict[str, MeetingResponse])
async def update_meeting(
    meeting_id: str,
    payload: MeetingUpdate,
    db: AsyncSession = Depends(get_db),
    workspace_id: str = Depends(get_workspace)
):
    meeting = await meeting_service.get(db, meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting {meeting_id} not found."
        )
    
    updated = await meeting_service.update(db, meeting, payload)
    return {"data": updated}
```

### 4.2 Filtering & Sorting implementation
Use Pydantic models for query parameters to get auto-validation and OpenAPI docs.

```python
from pydantic import BaseModel, Field
from typing import Optional

class MeetingQueryParams(BaseModel):
    cursor: Optional[str] = None
    limit: int = Field(default=50, le=100)
    status: Optional[str] = None
    sort: str = Field(default="-created_at")

@router.get("", response_model=MeetingListResponse)
async def list_meetings(
    params: MeetingQueryParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Pass params to service layer
    pass
```

## 5. Security Headers
All API responses must include:
* `Content-Security-Policy: default-src 'none'`
* `Strict-Transport-Security: max-age=31536000; includeSubDomains`
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
