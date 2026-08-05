from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MeetingSourceType, MeetingStatus
from app.models.meeting import Meeting


class MeetingRepository(Protocol):
    async def create_meeting(self, meeting: Meeting) -> Meeting: ...
    async def get_meeting_by_id(self, meeting_id: uuid.UUID) -> Meeting | None: ...
    async def update_meeting(self, meeting: Meeting) -> Meeting: ...


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
