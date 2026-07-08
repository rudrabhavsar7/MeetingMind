from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    ActionItemStatus,
    MeetingSourceApp,
    MeetingSourceType,
    MeetingStatus,
    enum_values,
)

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.workspace import Workspace


class Meeting(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "meetings"
    __table_args__ = (
        Index("ix_meetings_workspace_id", "workspace_id"),
        Index("ix_meetings_workspace_started_at", "workspace_id", "started_at"),
        Index("ix_meetings_workspace_status", "workspace_id", "status"),
        Index("ix_meetings_created_by_user_id", "created_by_user_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[MeetingStatus] = mapped_column(
        SAEnum(MeetingStatus, name="meeting_status", values_callable=enum_values),
        default=MeetingStatus.SCHEDULED,
        nullable=False,
    )
    source_type: Mapped[MeetingSourceType] = mapped_column(
        SAEnum(MeetingSourceType, name="meeting_source_type", values_callable=enum_values),
        nullable=False,
    )
    source_app: Mapped[MeetingSourceApp | None] = mapped_column(
        SAEnum(MeetingSourceApp, name="meeting_source_app", values_callable=enum_values),
        nullable=True,
    )
    client_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    source_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    visible_participants: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    media_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_audio_deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship(back_populates="meetings")
    created_by: Mapped[User | None] = relationship(back_populates="created_meetings")
    transcript_segments: Mapped[list[TranscriptSegment]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    action_items: Mapped[list[ActionItem]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    decisions: Mapped[list[Decision]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )


class TranscriptSegment(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (
        Index("ix_transcript_segments_workspace_id", "workspace_id"),
        Index("ix_transcript_segments_meeting_id", "meeting_id"),
        Index("ix_transcript_segments_meeting_start_time", "meeting_id", "start_time"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    meeting_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    speaker_label: Mapped[str] = mapped_column(String(120), nullable=False)
    speaker_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_final: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="transcript_segments")
    action_items: Mapped[list[ActionItem]] = relationship(
        back_populates="source_segment",
        foreign_keys="ActionItem.source_segment_id",
    )
    decisions: Mapped[list[Decision]] = relationship(
        back_populates="source_segment",
        foreign_keys="Decision.source_segment_id",
    )


class ActionItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "action_items"
    __table_args__ = (
        Index("ix_action_items_workspace_id", "workspace_id"),
        Index("ix_action_items_meeting_id", "meeting_id"),
        Index("ix_action_items_status", "status"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    meeting_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    source_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transcript_segments.id"),
        nullable=True,
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ActionItemStatus] = mapped_column(
        SAEnum(ActionItemStatus, name="action_item_status", values_callable=enum_values),
        default=ActionItemStatus.OPEN,
        nullable=False,
    )

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="action_items")
    source_segment: Mapped[TranscriptSegment | None] = relationship(
        back_populates="action_items",
        foreign_keys=[source_segment_id],
    )


class Decision(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "decisions"
    __table_args__ = (
        Index("ix_decisions_workspace_id", "workspace_id"),
        Index("ix_decisions_meeting_id", "meeting_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    meeting_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    source_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transcript_segments.id"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="decisions")
    source_segment: Mapped[TranscriptSegment | None] = relationship(
        back_populates="decisions",
        foreign_keys=[source_segment_id],
    )
