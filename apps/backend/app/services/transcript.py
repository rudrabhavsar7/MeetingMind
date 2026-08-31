from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meeting import TranscriptSegment


class TranscriptRepository(Protocol):
    async def list_segments(
        self,
        meeting_id: uuid.UUID,
        *,
        start_time: float | None = None,
        end_time: float | None = None,
        cursor: int | None = None,
        limit: int = 100,
    ) -> tuple[list[TranscriptSegment], int | None]: ...
    async def rename_speaker(
        self,
        meeting_id: uuid.UUID,
        speaker_label: str,
        speaker_name: str,
    ) -> int: ...
    async def search_segments(
        self,
        meeting_id: uuid.UUID,
        query: str,
        *,
        limit: int = 20,
    ) -> list[TranscriptSegment]: ...


class SqlAlchemyTranscriptRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_segments(
        self,
        meeting_id: uuid.UUID,
        *,
        start_time: float | None = None,
        end_time: float | None = None,
        cursor: int | None = None,
        limit: int = 100,
    ) -> tuple[list[TranscriptSegment], int | None]:
        stmt = (
            select(TranscriptSegment)
            .where(TranscriptSegment.meeting_id == meeting_id, TranscriptSegment.is_final.is_(True))
            .order_by(TranscriptSegment.sequence_number, TranscriptSegment.start_time)
        )
        if start_time is not None:
            stmt = stmt.where(TranscriptSegment.end_time >= start_time)
        if end_time is not None:
            stmt = stmt.where(TranscriptSegment.start_time <= end_time)
        if cursor is not None:
            stmt = stmt.where(TranscriptSegment.sequence_number > cursor)
        stmt = stmt.limit(limit + 1)
        result = await self._session.execute(stmt)
        rows = list(result.scalars().all())
        has_more = len(rows) > limit
        segments = rows[:limit]
        next_cursor = segments[-1].sequence_number if has_more and segments else None
        return segments, next_cursor

    async def rename_speaker(
        self,
        meeting_id: uuid.UUID,
        speaker_label: str,
        speaker_name: str,
    ) -> int:
        from sqlalchemy import update

        stmt = (
            update(TranscriptSegment)
            .where(TranscriptSegment.meeting_id == meeting_id, TranscriptSegment.speaker_label == speaker_label)
            .values(speaker_name=speaker_name)
        )
        result = await self._session.execute(stmt)
        await self._session.commit()
        return result.rowcount

    async def search_segments(
        self,
        meeting_id: uuid.UUID,
        query: str,
        *,
        limit: int = 20,
    ) -> list[TranscriptSegment]:
        stmt = (
            select(TranscriptSegment)
            .where(
                TranscriptSegment.meeting_id == meeting_id,
                TranscriptSegment.is_final.is_(True),
                TranscriptSegment.text.ilike(f"%{query}%"),
            )
            .order_by(TranscriptSegment.sequence_number)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class TranscriptService:
    def __init__(self, repository: TranscriptRepository) -> None:
        self._repository = repository

    async def list_segments(
        self,
        meeting_id: uuid.UUID,
        *,
        start_time: float | None = None,
        end_time: float | None = None,
        cursor: int | None = None,
        limit: int = 100,
    ) -> tuple[list[TranscriptSegment], int | None]:
        return await self._repository.list_segments(meeting_id, start_time=start_time, end_time=end_time, cursor=cursor, limit=limit)

    async def rename_speaker(
        self,
        meeting_id: uuid.UUID,
        speaker_label: str,
        speaker_name: str,
    ) -> int:
        return await self._repository.rename_speaker(meeting_id, speaker_label, speaker_name)

    async def search_segments(
        self,
        meeting_id: uuid.UUID,
        query: str,
        *,
        limit: int = 20,
    ) -> list[TranscriptSegment]:
        return await self._repository.search_segments(meeting_id, query, limit=limit)
