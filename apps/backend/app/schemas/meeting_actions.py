from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CitationResponse(BaseModel):
    segment_id: uuid.UUID
    start_time: float
    end_time: float

    model_config = ConfigDict(from_attributes=True)


class ActionItemResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    meeting_id: uuid.UUID
    ai_processing_run_id: uuid.UUID | None = None
    text: str
    assignee_name: str | None = None
    due_date: datetime | None = None
    status: str
    origin: str
    confidence_score: float | None = None
    citations: list[CitationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ActionItemListEnvelope(BaseModel):
    data: list[ActionItemResponse]


class ActionItemUpdateRequest(BaseModel):
    text: str | None = None
    assignee_name: str | None = None
    due_date: datetime | None = None
    status: str | None = None


class DecisionResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    meeting_id: uuid.UUID
    ai_processing_run_id: uuid.UUID | None = None
    title: str
    text: str
    rationale: str | None = None
    origin: str
    confidence_score: float | None = None
    citations: list[CitationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DecisionListEnvelope(BaseModel):
    data: list[DecisionResponse]


class SummaryVersionResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    meeting_id: uuid.UUID
    ai_processing_run_id: uuid.UUID | None = None
    version: int
    kind: str
    executive_summary: str | None = None
    key_points: list[str] = Field(default_factory=list)
    status: str
    citations: list[CitationResponse] = Field(default_factory=list)
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SummaryVersionListEnvelope(BaseModel):
    data: list[SummaryVersionResponse]


class SummaryRegenerateRequest(BaseModel):
    reason: str = "user_requested"


class SummaryRegenerateResponse(BaseModel):
    meeting_id: uuid.UUID
    status: str
    queued_task_id: str | None = None


class SummaryRegenerateEnvelope(BaseModel):
    data: SummaryRegenerateResponse


class SummaryEditRequest(BaseModel):
    executive_summary: str
    key_points: list[str] = Field(default_factory=list)


class AIFeedbackRequest(BaseModel):
    output_type: str = Field(..., pattern="^(summary_version|action_item|decision)$")
    output_id: uuid.UUID
    rating: str = Field(..., pattern="^(up|down)$")
    comment: str | None = None


class AIFeedbackResponse(BaseModel):
    id: uuid.UUID
    output_type: str
    output_id: uuid.UUID
    rating: str

    model_config = ConfigDict(from_attributes=True)
