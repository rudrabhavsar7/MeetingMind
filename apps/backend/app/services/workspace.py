from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Protocol, Sequence

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import generate_opaque_token, hash_opaque_token
from app.models.enums import WorkspaceRole
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceInvitation, WorkspaceMembership


class WorkspaceError(ValueError):
    pass


class NotFoundError(WorkspaceError):
    pass


class ForbiddenError(WorkspaceError):
    pass


class ConflictError(WorkspaceError):
    pass


@dataclass(frozen=True, slots=True)
class WorkspaceInvitationDispatch:
    workspace_name: str
    email: str
    token: str
    expires_at: datetime


class WorkspaceRepository(Protocol):
    async def get_workspace_by_id(self, workspace_id: uuid.UUID) -> Workspace | None: ...
    
    async def get_workspaces_for_user(self, user_id: uuid.UUID) -> Sequence[Workspace]: ...
    
    async def update_workspace(self, workspace: Workspace) -> Workspace: ...
    
    async def get_members(self, workspace_id: uuid.UUID) -> Sequence[WorkspaceMembership]: ...
    
    async def get_membership(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> WorkspaceMembership | None: ...
    
    async def update_membership(self, membership: WorkspaceMembership) -> WorkspaceMembership: ...
    
    async def delete_membership(self, membership: WorkspaceMembership) -> None: ...
    
    async def count_owners(self, workspace_id: uuid.UUID) -> int: ...
    
    async def get_active_invitation_by_email(
        self, workspace_id: uuid.UUID, email: str, now: datetime
    ) -> WorkspaceInvitation | None: ...
    
    async def create_invitation(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation: ...
    
    async def get_invitation_by_id(self, invitation_id: uuid.UUID) -> WorkspaceInvitation | None: ...
    
    async def update_invitation(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation: ...


class SqlAlchemyWorkspaceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_workspace_by_id(self, workspace_id: uuid.UUID) -> Workspace | None:
        result = await self._session.execute(
            select(Workspace).where(Workspace.id == workspace_id, Workspace.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_workspaces_for_user(self, user_id: uuid.UUID) -> Sequence[Workspace]:
        result = await self._session.execute(
            select(Workspace)
            .join(WorkspaceMembership, Workspace.id == WorkspaceMembership.workspace_id)
            .where(WorkspaceMembership.user_id == user_id, Workspace.deleted_at.is_(None))
        )
        return result.scalars().all()

    async def update_workspace(self, workspace: Workspace) -> Workspace:
        self._session.add(workspace)
        await self._session.commit()
        await self._session.refresh(workspace)
        return workspace

    async def get_members(self, workspace_id: uuid.UUID) -> Sequence[WorkspaceMembership]:
        result = await self._session.execute(
            select(WorkspaceMembership)
            .options(selectinload(WorkspaceMembership.user))
            .where(WorkspaceMembership.workspace_id == workspace_id)
        )
        return result.scalars().all()

    async def get_membership(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> WorkspaceMembership | None:
        result = await self._session.execute(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_membership(self, membership: WorkspaceMembership) -> WorkspaceMembership:
        self._session.add(membership)
        await self._session.commit()
        await self._session.refresh(membership)
        return membership

    async def delete_membership(self, membership: WorkspaceMembership) -> None:
        await self._session.delete(membership)
        await self._session.commit()

    async def count_owners(self, workspace_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.role == WorkspaceRole.OWNER,
            )
        )
        return len(result.scalars().all())

    async def get_active_invitation_by_email(
        self, workspace_id: uuid.UUID, email: str, now: datetime
    ) -> WorkspaceInvitation | None:
        result = await self._session.execute(
            select(WorkspaceInvitation).where(
                WorkspaceInvitation.workspace_id == workspace_id,
                WorkspaceInvitation.email == email,
                WorkspaceInvitation.accepted_at.is_(None),
                WorkspaceInvitation.revoked_at.is_(None),
                WorkspaceInvitation.expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    async def create_invitation(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        self._session.add(invitation)
        try:
            await self._session.commit()
            await self._session.refresh(invitation)
            return invitation
        except IntegrityError as exc:
            await self._session.rollback()
            raise ConflictError("Invitation could not be created due to a conflict") from exc

    async def get_invitation_by_id(self, invitation_id: uuid.UUID) -> WorkspaceInvitation | None:
        result = await self._session.execute(
            select(WorkspaceInvitation).where(WorkspaceInvitation.id == invitation_id)
        )
        return result.scalar_one_or_none()

    async def update_invitation(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        self._session.add(invitation)
        await self._session.commit()
        await self._session.refresh(invitation)
        return invitation


class WorkspaceService:
    def __init__(self, repository: WorkspaceRepository) -> None:
        self._repository = repository

    async def list_workspaces(self, user_id: uuid.UUID) -> Sequence[Workspace]:
        return await self._repository.get_workspaces_for_user(user_id)

    async def get_workspace(self, workspace_id: uuid.UUID) -> Workspace:
        workspace = await self._repository.get_workspace_by_id(workspace_id)
        if workspace is None:
            raise NotFoundError("Workspace not found")
        return workspace

    async def update_workspace(
        self,
        workspace_id: uuid.UUID,
        update_data: dict,
    ) -> Workspace:
        workspace = await self.get_workspace(workspace_id)
        for key, value in update_data.items():
            setattr(workspace, key, value)
        return await self._repository.update_workspace(workspace)

    async def list_members(self, workspace_id: uuid.UUID) -> Sequence[WorkspaceMembership]:
        # Just ensure workspace exists
        await self.get_workspace(workspace_id)
        return await self._repository.get_members(workspace_id)

    async def invite_member(
        self,
        workspace_id: uuid.UUID,
        inviter: User,
        email: str,
        role: WorkspaceRole,
    ) -> tuple[WorkspaceInvitation, WorkspaceInvitationDispatch | None]:
        if role == WorkspaceRole.OWNER:
            raise ForbiddenError("Cannot invite a user as an owner")
        
        workspace = await self.get_workspace(workspace_id)
        
        # Check if user is already a member
        members = await self._repository.get_members(workspace_id)
        if any(m.user.email == email for m in members if m.user):
            raise ConflictError("User is already a member of this workspace")
        
        now = datetime.now(UTC)
        # Check active invitation
        active_invitation = await self._repository.get_active_invitation_by_email(workspace_id, email, now)
        if active_invitation:
            raise ConflictError("An active invitation already exists for this email")
            
        token = generate_opaque_token()
        expires_at = now + timedelta(days=7)
        
        invitation = WorkspaceInvitation(
            workspace_id=workspace_id,
            email=email,
            role=role,
            token_hash=hash_opaque_token(token),
            invited_by_user_id=inviter.id,
            expires_at=expires_at,
        )
        invitation = await self._repository.create_invitation(invitation)
        
        dispatch = WorkspaceInvitationDispatch(
            workspace_name=workspace.name,
            email=email,
            token=token,
            expires_at=expires_at,
        )
        return invitation, dispatch

    async def revoke_invitation(self, workspace_id: uuid.UUID, invitation_id: uuid.UUID) -> None:
        invitation = await self._repository.get_invitation_by_id(invitation_id)
        if invitation is None or invitation.workspace_id != workspace_id:
            # We don't expose existence of other workspace's invitations
            return
            
        if invitation.accepted_at or invitation.revoked_at:
            return
            
        invitation.revoked_at = datetime.now(UTC)
        await self._repository.update_invitation(invitation)

    async def update_member_role(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        new_role: WorkspaceRole,
        actor_membership: WorkspaceMembership,
    ) -> WorkspaceMembership:
        membership = await self._repository.get_membership(workspace_id, user_id)
        if membership is None:
            raise NotFoundError("Membership not found")
            
        if membership.role == new_role:
            return membership
            
        # Only owner can grant or remove owner role
        if (new_role == WorkspaceRole.OWNER or membership.role == WorkspaceRole.OWNER) and actor_membership.role != WorkspaceRole.OWNER:
            raise ForbiddenError("Only an owner can grant or remove the owner role")
            
        # Cannot downgrade last owner
        if membership.role == WorkspaceRole.OWNER and new_role != WorkspaceRole.OWNER:
            owners_count = await self._repository.count_owners(workspace_id)
            if owners_count <= 1:
                raise ForbiddenError("Cannot downgrade the last owner of the workspace")
                
        membership.role = new_role
        return await self._repository.update_membership(membership)

    async def remove_member(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        actor_membership: WorkspaceMembership,
    ) -> None:
        membership = await self._repository.get_membership(workspace_id, user_id)
        if membership is None:
            return
            
        if membership.role == WorkspaceRole.OWNER and actor_membership.role != WorkspaceRole.OWNER:
            raise ForbiddenError("Only an owner can remove an owner")
            
        if membership.role == WorkspaceRole.OWNER:
            owners_count = await self._repository.count_owners(workspace_id)
            if owners_count <= 1:
                raise ForbiddenError("Cannot remove the last owner of the workspace")
                
        await self._repository.delete_membership(membership)

