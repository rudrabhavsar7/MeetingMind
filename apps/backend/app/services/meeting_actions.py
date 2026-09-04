from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import AIOutputFeedback, SummaryVersion
from app.models.enums import ActionItemStatus
from app.models.meeting import ActionItem, Decision


class MeetingActionRepository(Protocol):
    async def list_action_items(self, meeting_id: uuid.UUID, *, status: ActionItemStatus | None = None) -> list[ActionItem]: ...
    async def update_action_item(self, item_id: uuid.UUID, meeting_id: uuid.UUID, **kwargs: object) -> ActionItem | None: ...
    async def list_decisions(self, meeting_id: uuid.UUID) -> list[Decision]: ...
    async def list_summary_versions(self, meeting_id: uuid.UUID) -> list[SummaryVersion]: ...
    async def create_summary_version(self, version: SummaryVersion) -> SummaryVersion: ...
    async def get_summary_version(self, version_id: uuid.UUID, meeting_id: uuid.UUID) -> SummaryVersion | None: ...
    async def create_feedback(self, feedback: AIOutputFeedback) -> AIOutputFeedback: ...


class SqlAlchemyMeetingActionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_action_items(self, meeting_id: uuid.UUID, *, status: ActionItemStatus | None = None) -> list[ActionItem]:
        stmt = select(ActionItem).where(ActionItem.meeting_id == meeting_id, ActionItem.deleted_at.is_(None))
        if status is not None:
            stmt = stmt.where(ActionItem.status == status)
        stmt = stmt.order_by(ActionItem.created_at)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update_action_item(self, item_id: uuid.UUID, meeting_id: uuid.UUID, **kwargs: object) -> ActionItem | None:
        result = await self._session.execute(
            select(ActionItem).where(ActionItem.id == item_id, ActionItem.meeting_id == meeting_id, ActionItem.deleted_at.is_(None))
        )
        item = result.scalar_one_or_none()
        if not item:
            return None
        for key, value in kwargs.items():
            setattr(item, key, value)
        await self._session.commit()
        await self._session.refresh(item)
        return item

    async def list_decisions(self, meeting_id: uuid.UUID) -> list[Decision]:
        stmt = select(Decision).where(Decision.meeting_id == meeting_id, Decision.deleted_at.is_(None)).order_by(Decision.created_at)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_summary_versions(self, meeting_id: uuid.UUID) -> list[SummaryVersion]:
        stmt = select(SummaryVersion).where(SummaryVersion.meeting_id == meeting_id).order_by(SummaryVersion.version.desc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def create_summary_version(self, version: SummaryVersion) -> SummaryVersion:
        self._session.add(version)
        await self._session.commit()
        await self._session.refresh(version)
        return version

    async def get_summary_version(self, version_id: uuid.UUID, meeting_id: uuid.UUID) -> SummaryVersion | None:
        result = await self._session.execute(
            select(SummaryVersion).where(SummaryVersion.id == version_id, SummaryVersion.meeting_id == meeting_id)
        )
        return result.scalar_one_or_none()

    async def create_feedback(self, feedback: AIOutputFeedback) -> AIOutputFeedback:
        self._session.add(feedback)
        await self._session.commit()
        await self._session.refresh(feedback)
        return feedback


class MeetingActionService:
    def __init__(self, repository: MeetingActionRepository) -> None:
        self._repository = repository

    async def list_action_items(self, meeting_id: uuid.UUID, *, status: ActionItemStatus | None = None) -> list[ActionItem]:
        return await self._repository.list_action_items(meeting_id, status=status)

    async def update_action_item(self, item_id: uuid.UUID, meeting_id: uuid.UUID, **kwargs: object) -> ActionItem | None:
        return await self._repository.update_action_item(item_id, meeting_id, **kwargs)

    async def list_decisions(self, meeting_id: uuid.UUID) -> list[Decision]:
        return await self._repository.list_decisions(meeting_id)

    async def list_summary_versions(self, meeting_id: uuid.UUID) -> list[SummaryVersion]:
        return await self._repository.list_summary_versions(meeting_id)

    async def create_summary_version(self, version: SummaryVersion) -> SummaryVersion:
        return await self._repository.create_summary_version(version)

    async def get_summary_version(self, version_id: uuid.UUID, meeting_id: uuid.UUID) -> SummaryVersion | None:
        return await self._repository.get_summary_version(version_id, meeting_id)

    async def create_feedback(self, feedback: AIOutputFeedback) -> AIOutputFeedback:
        return await self._repository.create_feedback(feedback)
