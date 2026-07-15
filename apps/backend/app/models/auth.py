from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.workspace import Workspace


class RefreshToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_token_hash", "token_hash", unique=True),
        Index("ix_refresh_tokens_user_id", "user_id"),
        Index("ix_refresh_tokens_expires_at", "expires_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replaced_by_token_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("refresh_tokens.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped[User] = relationship(back_populates="refresh_tokens")
    replaced_by: Mapped[RefreshToken | None] = relationship(remote_side="RefreshToken.id")


class PasswordResetToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "password_reset_tokens"
    __table_args__ = (
        Index("ix_password_reset_tokens_token_hash", "token_hash", unique=True),
        Index("ix_password_reset_tokens_user_id", "user_id"),
        Index("ix_password_reset_tokens_expires_at", "expires_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="password_reset_tokens")


class ExtensionSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "extension_sessions"
    __table_args__ = (
        UniqueConstraint("user_id", "device_id", name="uq_extension_sessions_user_device"),
        Index("ix_extension_sessions_workspace_id", "workspace_id"),
        Index("ix_extension_sessions_user_id", "user_id"),
        Index("ix_extension_sessions_token_hash", "token_hash", unique=True),
        Index("ix_extension_sessions_expires_at", "expires_at"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    device_id: Mapped[str] = mapped_column(String(255), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    extension_version: Mapped[str] = mapped_column(String(80), nullable=False)
    browser: Mapped[str] = mapped_column(String(120), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_heartbeat_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship(back_populates="extension_sessions")
    user: Mapped[User] = relationship(back_populates="extension_sessions")
