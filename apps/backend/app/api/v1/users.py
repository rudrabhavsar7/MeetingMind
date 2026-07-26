from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.auth import CurrentUserResponse
from app.schemas.user import UserProfileUpdate, UserProfileUpdateEnvelope
from app.services.user import NotFoundError, SqlAlchemyUserRepository, UserService

router = APIRouter()


async def get_user_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserService:
    return UserService(SqlAlchemyUserRepository(session))


@router.patch("/me", response_model=UserProfileUpdateEnvelope)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserProfileUpdateEnvelope:
    try:
        updated_user = await user_service.update_profile(
            user_id=current_user.id,
            full_name=payload.full_name,
        )
        return UserProfileUpdateEnvelope(
            data=CurrentUserResponse(
                id=updated_user.id,
                email=updated_user.email,
                full_name=updated_user.full_name,
                workspaces=[
                    {
                        "id": membership.workspace.id,
                        "name": membership.workspace.name,
                        "slug": membership.workspace.slug,
                        "role": membership.role.value,
                    }
                    for membership in updated_user.memberships
                    if membership.workspace.deleted_at is None
                ],
            )
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
