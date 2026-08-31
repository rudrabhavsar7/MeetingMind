from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PresignedUrlRequest(BaseModel):
    filename: str
    mime_type: str
    file_size_bytes: int = Field(..., gt=0, le=2147483648)  # Max 2GB
    title: str


class PresignedUrlResponse(BaseModel):
    meeting_id: uuid.UUID
    upload_url: str
    object_key: str
    expires_at: datetime
    required_headers: dict[str, str]


class PresignedUrlEnvelope(BaseModel):
    data: PresignedUrlResponse


class ImportCompleteRequest(BaseModel):
    meeting_id: uuid.UUID
    object_key: str
    etag: str | None = None


class ImportCompleteResponse(BaseModel):
    meeting_id: uuid.UUID
    status: str
    queued_task_id: str | None = None


class ImportCompleteEnvelope(BaseModel):
    data: ImportCompleteResponse


class MeetingParticipant(BaseModel):
    display_name: str
    source_id: str | None = None


class LiveMeetingCreate(BaseModel):
    client_type: str
    source_type: str
    source_app: str
    source_url: str | None = None
    source_title: str | None = None
    visible_participants: list[MeetingParticipant] = Field(default_factory=list)
    started_at: datetime


class MeetingResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str | None
    status: str
    source_type: str
    source_app: str
    started_at: datetime


class LiveMeetingResponse(BaseModel):
    meeting: MeetingResponse
    stream_url: str
    stream_token: str
    stream_token_expires_at: datetime
    event_schema_version: str = "1.0"


class LiveMeetingEnvelope(BaseModel):
    data: LiveMeetingResponse


class StreamTokenRefreshRequest(BaseModel):
    client_instance_id: uuid.UUID
    last_acknowledged_sequence: int = -1


class StreamTokenRefreshResponse(BaseModel):
    stream_url: str
    stream_token: str
    expires_at: datetime


class StreamTokenRefreshEnvelope(BaseModel):
    data: StreamTokenRefreshResponse


class MeetingListItem(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str | None
    status: str
    source_type: str
    source_app: str | None
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    participant_count: int = 0
    summary_preview: str | None = None


class MeetingListMeta(BaseModel):
    next_cursor: datetime | None = None
    has_more: bool = False
    limit: int = 50


class MeetingListEnvelope(BaseModel):
    data: list[MeetingListItem]
    meta: MeetingListMeta


class MeetingDetailResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str | None
    status: str
    source_type: str
    source_app: str | None = None
    source_url: str | None = None
    source_title: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    raw_audio_retained: bool = False
    created_by_user_id: uuid.UUID | None = None
    participant_count: int = 0


class MeetingDetailEnvelope(BaseModel):
    data: MeetingDetailResponse
