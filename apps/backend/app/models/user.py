from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.auth import ExtensionSession, PasswordResetToken, RefreshToken
    from app.models.meeting import Meeting
    from app.models.workspace import WorkspaceInvitation, WorkspaceMembership


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email", "email"),)

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_object_key: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    memberships: Mapped[list[WorkspaceMembership]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    created_meetings: Mapped[list[Meeting]] = relationship(back_populates="created_by")
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    password_reset_tokens: Mapped[list[PasswordResetToken]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    extension_sessions: Mapped[list[ExtensionSession]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    issued_workspace_invitations: Mapped[list[WorkspaceInvitation]] = relationship(
        back_populates="invited_by",
    )
