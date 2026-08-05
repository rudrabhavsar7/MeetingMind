from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db_session
from app.models.enums import WorkspaceRole
from app.models.user import User
from app.models.workspace import WorkspaceMembership


def _role_level(role: WorkspaceRole) -> int:
    # Hierarchy: OWNER > ADMIN > MEMBER > VIEWER
    mapping = {
        WorkspaceRole.VIEWER: 1,
        WorkspaceRole.MEMBER: 2,
        WorkspaceRole.ADMIN: 3,
        WorkspaceRole.OWNER: 4,
    }
    return mapping[role]


def require_workspace_role(required_role: WorkspaceRole) -> Callable[..., Any]:
    async def role_checker(
        workspace_id: Annotated[uuid.UUID, Path(...)],
        user: Annotated[User, Depends(get_current_user)],
        db: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> WorkspaceMembership:
        result = await db.execute(
            select(WorkspaceMembership).where(
                WorkspaceMembership.user_id == user.id,
                WorkspaceMembership.workspace_id == workspace_id,
            )
        )
        membership = result.scalar_one_or_none()

        if membership is None:
            # According to specs, missing membership returns standard 403 Problem Details
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this workspace",
            )

        if _role_level(membership.role) < _role_level(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return membership

    return role_checker


async def require_workspace_member(
    workspace_id: Annotated[uuid.UUID, Path(...)],
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceMembership:
    # Alias for require_workspace_role(WorkspaceRole.VIEWER) but defined as a direct dependency
    result = await db.execute(
        select(WorkspaceMembership).where(
            WorkspaceMembership.user_id == user.id,
            WorkspaceMembership.workspace_id == workspace_id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace",
        )
    return membership
