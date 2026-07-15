from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import WorkspaceRole, enum_values

if TYPE_CHECKING:
    from app.models.auth import ExtensionSession
    from app.models.meeting import Meeting
    from app.models.user import User


class Workspace(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "workspaces"
    __table_args__ = (
        Index("ix_workspaces_slug", "slug"),
        Index("ix_workspaces_deleted_at", "deleted_at"),
        Index(
            "uq_workspaces_single_default",
            "is_default",
            unique=True,
            postgresql_where=text("is_default"),
        ),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    settings: Mapped[dict[str, object]] = mapped_column(JSONB, default=dict, nullable=False)
    raw_audio_retention_days: Mapped[int | None] = mapped_column(nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    memberships: Mapped[list[WorkspaceMembership]] = relationship(
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    meetings: Mapped[list[Meeting]] = relationship(
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    invitations: Mapped[list[WorkspaceInvitation]] = relationship(
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    extension_sessions: Mapped[list[ExtensionSession]] = relationship(
        back_populates="workspace",
        cascade="all, delete-orphan",
    )


class WorkspaceMembership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "workspace_memberships"
    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_memberships_user"),
        Index("ix_workspace_memberships_workspace_id", "workspace_id"),
        Index("ix_workspace_memberships_user_id", "user_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[WorkspaceRole] = mapped_column(
        SAEnum(WorkspaceRole, name="workspace_role", values_callable=enum_values),
        nullable=False,
        default=WorkspaceRole.MEMBER,
    )

    workspace: Mapped[Workspace] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(back_populates="memberships")


class WorkspaceInvitation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "workspace_invitations"
    __table_args__ = (
        Index("ix_workspace_invitations_workspace_id", "workspace_id"),
        Index("ix_workspace_invitations_token_hash", "token_hash", unique=True),
        Index("ix_workspace_invitations_expires_at", "expires_at"),
        Index(
            "uq_workspace_invitations_pending_email",
            "workspace_id",
            "email",
            unique=True,
            postgresql_where=text("accepted_at IS NULL AND revoked_at IS NULL"),
        ),
        CheckConstraint("role <> 'owner'", name="ck_workspace_invitations_non_owner_role"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    role: Mapped[WorkspaceRole] = mapped_column(
        SAEnum(WorkspaceRole, name="workspace_role", values_callable=enum_values),
        nullable=False,
        default=WorkspaceRole.MEMBER,
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    invited_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship(back_populates="invitations")
    invited_by: Mapped[User] = relationship(back_populates="issued_workspace_invitations")
