from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TranscriptSegmentResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    meeting_id: uuid.UUID
    speaker_label: str
    speaker_name: str | None = None
    start_time: float
    end_time: float
    sequence_number: int
    text: str
    is_final: bool = True
    stt_confidence: float | None = None
    language: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TranscriptListMeta(BaseModel):
    next_cursor: int | None = None
    has_more: bool = False
    limit: int = 100


class TranscriptListEnvelope(BaseModel):
    data: list[TranscriptSegmentResponse]
    meta: TranscriptListMeta


class SpeakerRenameRequest(BaseModel):
    speaker_name: str = Field(..., min_length=1, max_length=255)


class SpeakerRenameResponse(BaseModel):
    meeting_id: uuid.UUID
    speaker_label: str
    speaker_name: str
    updated_segments: int


class SpeakerRenameEnvelope(BaseModel):
    data: SpeakerRenameResponse


class TranscriptSearchResult(BaseModel):
    segment: TranscriptSegmentResponse
    highlight_ranges: list[dict[str, int]] = Field(default_factory=list)


class TranscriptSearchEnvelope(BaseModel):
    data: list[TranscriptSearchResult]
