from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import WorkspaceRole


class WorkspaceSettingsUpdate(BaseModel):
    default_capture_source: str | None = None
    model_config = ConfigDict(extra="allow")


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    raw_audio_retention_days: int | None = Field(default=None, ge=1)
    settings: dict[str, Any] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkspaceDetails(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str
    settings: dict[str, Any]
    raw_audio_retention_days: int | None
    created_at: datetime


class WorkspaceDetailsEnvelope(BaseModel):
    data: WorkspaceDetails


class WorkspaceSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str


class WorkspaceListEnvelope(BaseModel):
    data: list[WorkspaceSummary]


class WorkspaceMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    full_name: str
    role: str
    created_at: datetime


class WorkspaceMemberListEnvelope(BaseModel):
    data: list[WorkspaceMemberResponse]


class WorkspaceMemberUpdate(BaseModel):
    role: WorkspaceRole


class WorkspaceMemberUpdateEnvelope(BaseModel):
    data: WorkspaceMemberResponse


class InvitationCreateRequest(BaseModel):
    email: str
    role: WorkspaceRole

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class WorkspaceInvitationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime


class WorkspaceInvitationEnvelope(BaseModel):
    data: WorkspaceInvitationResponse


class WorkspaceActionItemResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    meeting_id: uuid.UUID
    text: str
    assignee_name: str | None = None
    due_date: datetime | None = None
    status: str
    origin: str
    meeting_title: str | None = None
    citations: list[dict[str, object]] = Field(default_factory=list)


class WorkspaceActionItemListMeta(BaseModel):
    next_cursor: str | None = None
    has_more: bool = False
    limit: int = 50


class WorkspaceActionItemListEnvelope(BaseModel):
    data: list[WorkspaceActionItemResponse]
    meta: WorkspaceActionItemListMeta
