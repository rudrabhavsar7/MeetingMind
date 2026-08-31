from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_workspace_member
from app.db.session import get_db_session
from app.models.meeting import Meeting, TranscriptSegment
from app.models.workspace import WorkspaceMembership

router = APIRouter()


class TranscriptSegmentResponse(BaseModel):
    id: str
    speaker_label: str
    speaker_name: str | None = None
    start_time: float
    end_time: float
    text: str
    is_final: bool


class TranscriptEnvelope(BaseModel):
    data: list[TranscriptSegmentResponse]


class SearchResultResponse(BaseModel):
    segment: TranscriptSegmentResponse
    meeting_id: str
    rank: int


class SearchEnvelope(BaseModel):
    data: list[SearchResultResponse]
    total: int


@router.get("/{meeting_id}/transcript", response_model=TranscriptEnvelope)
async def get_transcript(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TranscriptEnvelope:
    stmt = (
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id, TranscriptSegment.workspace_id == workspace_id)
        .order_by(TranscriptSegment.start_time)
    )
    result = await db.execute(stmt)
    segments = list(result.scalars().all())
    return TranscriptEnvelope(
        data=[
            TranscriptSegmentResponse(
                id=str(s.id),
                speaker_label=s.speaker_label,
                speaker_name=s.speaker_name,
                start_time=s.start_time,
                end_time=s.end_time,
                text=s.text,
                is_final=s.is_final,
            )
            for s in segments
        ]
    )


@router.get("/{meeting_id}/transcript/search", response_model=SearchEnvelope)
async def search_transcript(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    q: str = Query(..., min_length=1, max_length=500),
    limit: int = Query(default=20, ge=1, le=100),
) -> SearchEnvelope:
    search_term = f"%{q}%"
    stmt = (
        select(TranscriptSegment)
        .where(
            TranscriptSegment.meeting_id == meeting_id,
            TranscriptSegment.workspace_id == workspace_id,
            TranscriptSegment.deleted_at.is_(None),
            TranscriptSegment.text.ilike(search_term),
        )
        .order_by(TranscriptSegment.start_time)
        .limit(limit)
    )
    result = await db.execute(stmt)
    segments = list(result.scalars().all())
    return SearchEnvelope(
        data=[
            SearchResultResponse(
                segment=TranscriptSegmentResponse(
                    id=str(s.id),
                    speaker_label=s.speaker_label,
                    speaker_name=s.speaker_name,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    text=s.text,
                    is_final=s.is_final,
                ),
                meeting_id=str(meeting_id),
                rank=idx + 1,
            )
            for idx, s in enumerate(segments)
        ],
        total=len(segments),
    )
