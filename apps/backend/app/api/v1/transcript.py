from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_workspace_member
from app.db.session import get_db_session
from app.models.workspace import WorkspaceMembership
from app.schemas.transcript import (
    TranscriptListEnvelope,
    TranscriptListMeta,
    TranscriptSearchEnvelope,
    TranscriptSearchResult,
    TranscriptSegmentResponse,
    SpeakerRenameEnvelope,
    SpeakerRenameRequest,
    SpeakerRenameResponse,
)
from app.services.meeting import MeetingService, SqlAlchemyMeetingRepository
from app.services.transcript import SqlAlchemyTranscriptRepository, TranscriptService

router = APIRouter()


async def get_transcript_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TranscriptService:
    return TranscriptService(SqlAlchemyTranscriptRepository(session))


async def get_meeting_service_for_transcript(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeetingService:
    return MeetingService(SqlAlchemyMeetingRepository(session))


@router.get("/{meeting_id}/transcript", response_model=TranscriptListEnvelope)
async def list_transcript_segments(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    transcript_service: Annotated[TranscriptService, Depends(get_transcript_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service_for_transcript)],
    cursor: int | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    start_time: float | None = None,
    end_time: float | None = None,
) -> TranscriptListEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments, next_cursor = await transcript_service.list_segments(
        meeting_id, start_time=start_time, end_time=end_time, cursor=cursor, limit=limit
    )

    return TranscriptListEnvelope(
        data=[TranscriptSegmentResponse.model_validate(s) for s in segments],
        meta=TranscriptListMeta(next_cursor=next_cursor, has_more=next_cursor is not None, limit=limit),
    )


@router.patch("/{meeting_id}/transcript/speakers/{speaker_label}", response_model=SpeakerRenameEnvelope)
async def rename_speaker(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    speaker_label: str,
    payload: SpeakerRenameRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    transcript_service: Annotated[TranscriptService, Depends(get_transcript_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service_for_transcript)],
) -> SpeakerRenameEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    updated = await transcript_service.rename_speaker(meeting_id, speaker_label, payload.speaker_name)

    return SpeakerRenameEnvelope(
        data=SpeakerRenameResponse(
            meeting_id=meeting_id,
            speaker_label=speaker_label,
            speaker_name=payload.speaker_name,
            updated_segments=updated,
        )
    )


@router.get("/{meeting_id}/transcript/search", response_model=TranscriptSearchEnvelope)
async def search_transcript(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    transcript_service: Annotated[TranscriptService, Depends(get_transcript_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service_for_transcript)],
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(default=20, ge=1, le=50),
) -> TranscriptSearchEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = await transcript_service.search_segments(meeting_id, q, limit=limit)

    results: list[TranscriptSearchResult] = []
    for seg in segments:
        text_lower = seg.text.lower()
        q_lower = q.lower()
        highlight_ranges: list[dict[str, int]] = []
        start_idx = 0
        while True:
            idx = text_lower.find(q_lower, start_idx)
            if idx == -1:
                break
            highlight_ranges.append({"start": idx, "end": idx + len(q)})
            start_idx = idx + 1
        results.append(TranscriptSearchResult(segment=TranscriptSegmentResponse.model_validate(seg), highlight_ranges=highlight_ranges))

    return TranscriptSearchEnvelope(data=results)
