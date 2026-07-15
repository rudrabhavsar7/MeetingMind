from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import UUIDPrimaryKeyMixin, utc_now

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.workspace import Workspace


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_workspace_id", "workspace_id"),
        Index("ix_audit_logs_actor_user_id", "actor_user_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(120), nullable=False)
    resource_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    request_id: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    audit_metadata: Mapped[dict[str, object]] = mapped_column(
        "metadata", JSONB, default=dict, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    workspace: Mapped[Workspace | None] = relationship()
    actor: Mapped[User | None] = relationship()
