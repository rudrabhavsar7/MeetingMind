from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_workspace_member, require_workspace_role
from app.api.v1.auth import get_current_user
from app.core.config import Settings, get_settings
from app.db.session import get_db_session
from app.models.enums import WorkspaceRole
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.schemas.workspace import (
    InvitationCreateRequest,
    WorkspaceDetails,
    WorkspaceDetailsEnvelope,
    WorkspaceInvitationEnvelope,
    WorkspaceInvitationResponse,
    WorkspaceListEnvelope,
    WorkspaceMemberListEnvelope,
    WorkspaceMemberResponse,
    WorkspaceMemberUpdate,
    WorkspaceMemberUpdateEnvelope,
    WorkspaceSummary,
    WorkspaceUpdate,
)
from app.services.notifications import (
    WorkspaceInvitationNotifier,
    build_workspace_invitation_notifier,
)
from app.services.workspace import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    SqlAlchemyWorkspaceRepository,
    WorkspaceService,
)

router = APIRouter()


async def get_workspace_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceService:
    return WorkspaceService(SqlAlchemyWorkspaceRepository(session))


def get_invitation_notifier(
    settings: Annotated[Settings, Depends(get_settings)],
) -> WorkspaceInvitationNotifier:
    return build_workspace_invitation_notifier(settings)


@router.get("", response_model=WorkspaceListEnvelope)
async def list_workspaces(
    user: Annotated[User, Depends(get_current_user)],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> WorkspaceListEnvelope:
    workspaces = await workspace_service.list_workspaces(user.id)
    # The list_workspaces query already filters by deleted_at IS NULL
    # We need to map to WorkspaceSummary, which requires knowing the user's role
    summaries = []
    for ws in workspaces:
        # Find the role from memberships loaded (if loaded, wait, list_workspaces uses a join)
        # Actually in list_workspaces we didn't load the membership object onto the workspace.
        # It's better to fetch memberships directly or load them.
        # Let's just find the user's membership
        role = None
        for m in user.memberships:
            if m.workspace_id == ws.id:
                role = m.role
                break
        if role:
            summaries.append(
                WorkspaceSummary(
                    id=ws.id,
                    name=ws.name,
                    slug=ws.slug,
                    role=role.value,
                )
            )
    return WorkspaceListEnvelope(data=summaries)


@router.get("/{workspace_id}", response_model=WorkspaceDetailsEnvelope)
async def get_workspace(
    workspace_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> WorkspaceDetailsEnvelope:
    try:
        workspace = await workspace_service.get_workspace(workspace_id)
        return WorkspaceDetailsEnvelope(
            data=WorkspaceDetails(
                id=workspace.id,
                name=workspace.name,
                slug=workspace.slug,
                role=membership.role.value,
                settings=workspace.settings,
                raw_audio_retention_days=workspace.raw_audio_retention_days,
                created_at=workspace.created_at,
            )
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{workspace_id}", response_model=WorkspaceDetailsEnvelope)
async def update_workspace(
    workspace_id: uuid.UUID,
    payload: WorkspaceUpdate,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.ADMIN))],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> WorkspaceDetailsEnvelope:
    try:
        update_data = payload.model_dump(exclude_unset=True)
        workspace = await workspace_service.update_workspace(workspace_id, update_data)
        return WorkspaceDetailsEnvelope(
            data=WorkspaceDetails(
                id=workspace.id,
                name=workspace.name,
                slug=workspace.slug,
                role=membership.role.value,
                settings=workspace.settings,
                raw_audio_retention_days=workspace.raw_audio_retention_days,
                created_at=workspace.created_at,
            )
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{workspace_id}/members", response_model=WorkspaceMemberListEnvelope)
async def list_members(
    workspace_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> WorkspaceMemberListEnvelope:
    try:
        members = await workspace_service.list_members(workspace_id)
        return WorkspaceMemberListEnvelope(
            data=[
                WorkspaceMemberResponse(
                    id=m.id,
                    user_id=m.user_id,
                    email=m.user.email,
                    full_name=m.user.full_name,
                    role=m.role.value,
                    created_at=m.created_at,
                )
                for m in members
            ]
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/{workspace_id}/invitations",
    response_model=WorkspaceInvitationEnvelope,
    status_code=status.HTTP_201_CREATED,
)
async def create_invitation(
    workspace_id: uuid.UUID,
    payload: InvitationCreateRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.ADMIN))],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    notifier: Annotated[WorkspaceInvitationNotifier, Depends(get_invitation_notifier)],
    background_tasks: BackgroundTasks,
) -> WorkspaceInvitationEnvelope:
    try:
        invitation, dispatch = await workspace_service.invite_member(
            workspace_id=workspace_id,
            inviter=membership.user,
            email=payload.email,
            role=payload.role,
        )
        if dispatch:
            background_tasks.add_task(notifier.send, dispatch)
            
        return WorkspaceInvitationEnvelope(
            data=WorkspaceInvitationResponse(
                id=invitation.id,
                workspace_id=invitation.workspace_id,
                email=invitation.email,
                role=invitation.role.value,
                status="pending",
                expires_at=invitation.expires_at,
                created_at=invitation.created_at,
            )
        )
    except ForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/{workspace_id}/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
async def revoke_invitation(
    workspace_id: uuid.UUID,
    invitation_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.ADMIN))],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> None:
    await workspace_service.revoke_invitation(workspace_id, invitation_id)


@router.patch("/{workspace_id}/members/{user_id}", response_model=WorkspaceMemberUpdateEnvelope)
async def update_member_role(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: WorkspaceMemberUpdate,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.ADMIN))],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> WorkspaceMemberUpdateEnvelope:
    try:
        updated_membership = await workspace_service.update_member_role(
            workspace_id=workspace_id,
            user_id=user_id,
            new_role=payload.role,
            actor_membership=membership,
        )
        return WorkspaceMemberUpdateEnvelope(
            data=WorkspaceMemberResponse(
                id=updated_membership.id,
                user_id=updated_membership.user_id,
                email=updated_membership.user.email,
                full_name=updated_membership.user.full_name,
                role=updated_membership.role.value,
                created_at=updated_membership.created_at,
            )
        )
    except ForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/{workspace_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.ADMIN))],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> None:
    try:
        await workspace_service.remove_member(
            workspace_id=workspace_id,
            user_id=user_id,
            actor_membership=membership,
        )
    except ForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
