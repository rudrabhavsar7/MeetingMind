from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.workspace import WorkspaceMembership


class UserError(ValueError):
    pass


class NotFoundError(UserError):
    pass


class UserRepository(Protocol):
    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None: ...
    async def update_user(self, user: User) -> User: ...


class SqlAlchemyUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.memberships).selectinload(WorkspaceMembership.workspace))
            .where(User.id == user_id, User.is_active.is_(True), User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def update_user(self, user: User) -> User:
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return user


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    async def update_profile(
        self,
        user_id: uuid.UUID,
        full_name: str | None,
    ) -> User:
        user = await self._repository.get_user_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")

        if full_name is not None:
            user.full_name = full_name

        return await self._repository.update_user(user)
