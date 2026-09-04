from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MeetingSourceType, MeetingStatus
from app.models.meeting import Meeting


class MeetingRepository(Protocol):
    async def create_meeting(self, meeting: Meeting) -> Meeting: ...
    async def get_meeting_by_id(self, meeting_id: uuid.UUID) -> Meeting | None: ...
    async def update_meeting(self, meeting: Meeting) -> Meeting: ...
    async def list_meetings(
        self,
        workspace_id: uuid.UUID,
        *,
        status: MeetingStatus | None = None,
        source_type: MeetingSourceType | None = None,
        cursor: datetime | None = None,
        limit: int = 50,
    ) -> tuple[list[Meeting], datetime | None]: ...
    async def get_meeting_detail(self, meeting_id: uuid.UUID, workspace_id: uuid.UUID) -> Meeting | None: ...
    async def soft_delete_meeting(self, meeting_id: uuid.UUID, workspace_id: uuid.UUID) -> bool: ...
    async def get_participant_count(self, meeting_id: uuid.UUID) -> int: ...
    async def get_summary_preview(self, meeting_id: uuid.UUID) -> str | None: ...


class SqlAlchemyMeetingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_meeting(self, meeting: Meeting) -> Meeting:
        self._session.add(meeting)
        await self._session.commit()
        await self._session.refresh(meeting)
        return meeting

    async def get_meeting_by_id(self, meeting_id: uuid.UUID) -> Meeting | None:
        result = await self._session.execute(select(Meeting).where(Meeting.id == meeting_id, Meeting.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    async def update_meeting(self, meeting: Meeting) -> Meeting:
        self._session.add(meeting)
        await self._session.commit()
        await self._session.refresh(meeting)
        return meeting

    async def list_meetings(
        self,
        workspace_id: uuid.UUID,
        *,
        status: MeetingStatus | None = None,
        source_type: MeetingSourceType | None = None,
        cursor: datetime | None = None,
        limit: int = 50,
    ) -> tuple[list[Meeting], datetime | None]:
        stmt = select(Meeting).where(Meeting.workspace_id == workspace_id, Meeting.deleted_at.is_(None)).order_by(Meeting.started_at.desc())
        if status is not None:
            stmt = stmt.where(Meeting.status == status)
        if source_type is not None:
            stmt = stmt.where(Meeting.source_type == source_type)
        if cursor is not None:
            stmt = stmt.where(Meeting.started_at < cursor)
        stmt = stmt.limit(limit + 1)
        result = await self._session.execute(stmt)
        rows = list(result.scalars().all())
        has_more = len(rows) > limit
        meetings = rows[:limit]
        next_cursor = meetings[-1].started_at if has_more and meetings else None
        return meetings, next_cursor

    async def get_meeting_detail(self, meeting_id: uuid.UUID, workspace_id: uuid.UUID) -> Meeting | None:
        result = await self._session.execute(
            select(Meeting).where(Meeting.id == meeting_id, Meeting.workspace_id == workspace_id, Meeting.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def soft_delete_meeting(self, meeting_id: uuid.UUID, workspace_id: uuid.UUID) -> bool:
        meeting = await self.get_meeting_detail(meeting_id, workspace_id)
        if not meeting:
            return False
        meeting.deleted_at = datetime.now(UTC)
        await self._session.commit()
        return True

    async def get_participant_count(self, meeting_id: uuid.UUID) -> int:
        from app.models.meeting import MeetingParticipant

        result = await self._session.execute(
            select(func.count()).select_from(MeetingParticipant).where(MeetingParticipant.meeting_id == meeting_id)
        )
        return result.scalar_one()

    async def get_summary_preview(self, meeting_id: uuid.UUID) -> str | None:
        from app.models.ai import SummaryVersion

        result = await self._session.execute(
            select(SummaryVersion.executive_summary)
            .where(SummaryVersion.meeting_id == meeting_id, SummaryVersion.status == "current")
            .order_by(SummaryVersion.version.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return row[:200] + "..." if row and len(row) > 200 else row


class MeetingService:
    def __init__(self, repository: MeetingRepository) -> None:
        self._repository = repository

    async def create_meeting(
        self,
        workspace_id: uuid.UUID,
        title: str,
        source_type: MeetingSourceType,
        source_app: str,
        started_at: datetime | None = None,
        status: MeetingStatus = MeetingStatus.RECORDING,
    ) -> Meeting:
        meeting = Meeting(
            workspace_id=workspace_id,
            title=title,
            status=status,
            source_type=source_type,
            source_app=source_app,
            started_at=started_at or datetime.now(UTC),
        )
        return await self._repository.create_meeting(meeting)

    async def get_meeting(self, meeting_id: uuid.UUID) -> Meeting | None:
        return await self._repository.get_meeting_by_id(meeting_id)

    async def update_status(self, meeting_id: uuid.UUID, status: MeetingStatus) -> Meeting | None:
        meeting = await self._repository.get_meeting_by_id(meeting_id)
        if meeting:
            meeting.status = status
            return await self._repository.update_meeting(meeting)
        return None

    async def list_meetings(
        self,
        workspace_id: uuid.UUID,
        *,
        status: MeetingStatus | None = None,
        source_type: MeetingSourceType | None = None,
        cursor: datetime | None = None,
        limit: int = 50,
    ) -> tuple[list[Meeting], datetime | None]:
        return await self._repository.list_meetings(workspace_id, status=status, source_type=source_type, cursor=cursor, limit=limit)

    async def get_meeting_detail(self, meeting_id: uuid.UUID, workspace_id: uuid.UUID) -> Meeting | None:
        return await self._repository.get_meeting_detail(meeting_id, workspace_id)

    async def soft_delete_meeting(self, meeting_id: uuid.UUID, workspace_id: uuid.UUID) -> bool:
        return await self._repository.soft_delete_meeting(meeting_id, workspace_id)

    async def get_participant_count(self, meeting_id: uuid.UUID) -> int:
        return await self._repository.get_participant_count(meeting_id)

    async def get_summary_preview(self, meeting_id: uuid.UUID) -> str | None:
        return await self._repository.get_summary_preview(meeting_id)
