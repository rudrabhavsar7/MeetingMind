from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin, utc_now
from app.models.enums import (
    ActionItemStatus,
    MediaKind,
    MediaStatus,
    MeetingSourceApp,
    MeetingSourceType,
    MeetingStatus,
    OutputOrigin,
    enum_values,
)

if TYPE_CHECKING:
    from app.models.ai import (
        AIOutputCitation,
        AIOutputFeedback,
        AIProcessingRun,
        SummaryVersion,
    )
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

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
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
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    source_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_summary_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("summary_versions.id", use_alter=True, ondelete="SET NULL"), nullable=True
    )
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_audio_retained: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship(back_populates="meetings")
    created_by: Mapped[User] = relationship(back_populates="created_meetings")
    current_summary_version: Mapped[SummaryVersion | None] = relationship(
        foreign_keys=[current_summary_version_id], post_update=True
    )
    participants: Mapped[list[MeetingParticipant]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    media_objects: Mapped[list[MediaObject]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    transcript_segments: Mapped[list[TranscriptSegment]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    transcript_chunks: Mapped[list[TranscriptChunk]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    processing_runs: Mapped[list[AIProcessingRun]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )
    summary_versions: Mapped[list[SummaryVersion]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        foreign_keys="SummaryVersion.meeting_id",
    )
    action_items: Mapped[list[ActionItem]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    decisions: Mapped[list[Decision]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )


class MeetingParticipant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "meeting_participants"
    __table_args__ = (
        Index("ix_meeting_participants_workspace_id", "workspace_id"),
        Index("ix_meeting_participants_meeting_id", "meeting_id"),
        Index(
            "uq_meeting_participants_source_id",
            "meeting_id",
            "source_participant_id",
            unique=True,
            postgresql_where=text("source_participant_id IS NOT NULL"),
        ),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    source_participant_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    participant_metadata: Mapped[dict[str, object]] = mapped_column(
        "metadata", JSONB, default=dict, nullable=False
    )

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="participants")
    user: Mapped[User | None] = relationship()


class MediaObject(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "media_objects"
    __table_args__ = (
        Index("ix_media_objects_workspace_id", "workspace_id"),
        Index("ix_media_objects_meeting_id", "meeting_id"),
        Index("ix_media_objects_retention_until", "retention_until"),
        UniqueConstraint("workspace_id", "object_key", name="uq_media_objects_object_key"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[MediaKind] = mapped_column(
        SAEnum(MediaKind, name="media_kind", values_callable=enum_values), nullable=False
    )
    object_key: Mapped[str] = mapped_column(String(2048), nullable=False)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    retention_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[MediaStatus] = mapped_column(
        SAEnum(MediaStatus, name="media_status", values_callable=enum_values), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="media_objects")


class TranscriptSegment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (
        Index("ix_transcript_segments_workspace_id", "workspace_id"),
        Index("ix_transcript_segments_meeting_id", "meeting_id"),
        Index("ix_transcript_segments_meeting_start_time", "meeting_id", "start_time"),
        UniqueConstraint(
            "meeting_id",
            "client_instance_id",
            "sequence_number",
            name="uq_transcript_segments_stream_sequence",
        ),
        CheckConstraint(
            "start_time >= 0 AND end_time > start_time",
            name="ck_transcript_segments_valid_timing",
        ),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    client_instance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, default=uuid.uuid4, nullable=False
    )
    speaker_label: Mapped[str] = mapped_column(String(120), nullable=False)
    speaker_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_final: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    stt_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    language: Mapped[str | None] = mapped_column(String(32), nullable=True)
    supersedes_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="RESTRICT"), nullable=True
    )

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="transcript_segments")
    citations: Mapped[list[AIOutputCitation]] = relationship(
        back_populates="transcript_segment", cascade="all, delete-orphan"
    )
    supersedes: Mapped[TranscriptSegment | None] = relationship(
        remote_side="TranscriptSegment.id", foreign_keys=[supersedes_segment_id]
    )


class TranscriptChunk(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "transcript_chunks"
    __table_args__ = (
        UniqueConstraint(
            "meeting_id",
            "content_hash",
            "chunker_version",
            "embedding_model",
            name="uq_transcript_chunks_content_version",
        ),
        Index("ix_transcript_chunks_workspace_meeting", "workspace_id", "meeting_id"),
        Index("ix_transcript_chunks_meeting_start_time", "meeting_id", "start_time"),
        Index(
            "ix_transcript_chunks_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        CheckConstraint(
            "start_time >= 0 AND end_time > start_time",
            name="ck_transcript_chunks_valid_timing",
        ),
        CheckConstraint(
            "embedding_dimensions = 768",
            name="ck_transcript_chunks_embedding_dimensions",
        ),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    first_segment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="RESTRICT"), nullable=False
    )
    last_segment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="RESTRICT"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    chunker_version: Mapped[str] = mapped_column(String(80), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(255), nullable=False)
    embedding_dimensions: Mapped[int] = mapped_column(Integer, default=768, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(768), nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="transcript_chunks")
    first_segment: Mapped[TranscriptSegment] = relationship(
        foreign_keys=[first_segment_id]
    )
    last_segment: Mapped[TranscriptSegment] = relationship(foreign_keys=[last_segment_id])


class ActionItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "action_items"
    __table_args__ = (
        Index("ix_action_items_workspace_id", "workspace_id"),
        Index("ix_action_items_meeting_id", "meeting_id"),
        Index("ix_action_items_status", "status"),
        Index(
            "ix_action_items_workspace_meeting_created",
            "workspace_id",
            "meeting_id",
            "created_at",
        ),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    ai_processing_run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("ai_processing_runs.id", ondelete="SET NULL"), nullable=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assignee_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ActionItemStatus] = mapped_column(
        SAEnum(ActionItemStatus, name="action_item_status", values_callable=enum_values),
        default=ActionItemStatus.OPEN,
        nullable=False,
    )
    origin: Mapped[OutputOrigin] = mapped_column(
        SAEnum(OutputOrigin, name="output_origin", values_callable=enum_values),
        default=OutputOrigin.AI,
        nullable=False,
    )
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="action_items")
    processing_run: Mapped[AIProcessingRun | None] = relationship(
        back_populates="action_items"
    )
    assignee: Mapped[User | None] = relationship(foreign_keys=[assignee_user_id])
    updated_by: Mapped[User | None] = relationship(foreign_keys=[updated_by_user_id])
    citations: Mapped[list[AIOutputCitation]] = relationship(
        back_populates="action_item", cascade="all, delete-orphan"
    )
    feedback: Mapped[list[AIOutputFeedback]] = relationship(
        back_populates="action_item", cascade="all, delete-orphan"
    )


class Decision(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "decisions"
    __table_args__ = (
        Index("ix_decisions_workspace_id", "workspace_id"),
        Index("ix_decisions_meeting_id", "meeting_id"),
        Index(
            "ix_decisions_workspace_meeting_created",
            "workspace_id",
            "meeting_id",
            "created_at",
        ),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    ai_processing_run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("ai_processing_runs.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    origin: Mapped[OutputOrigin] = mapped_column(
        SAEnum(OutputOrigin, name="output_origin", values_callable=enum_values),
        default=OutputOrigin.AI,
        nullable=False,
    )
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="decisions")
    processing_run: Mapped[AIProcessingRun | None] = relationship(
        back_populates="decisions"
    )
    updated_by: Mapped[User | None] = relationship(foreign_keys=[updated_by_user_id])
    citations: Mapped[list[AIOutputCitation]] = relationship(
        back_populates="decision", cascade="all, delete-orphan"
    )
    feedback: Mapped[list[AIOutputFeedback]] = relationship(
        back_populates="decision", cascade="all, delete-orphan"
    )
