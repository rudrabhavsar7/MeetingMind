from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin, utc_now
from app.models.enums import (
    AIProcessingMode,
    AIProcessingStage,
    FeedbackRating,
    ProcessingStatus,
    SummaryKind,
    SummaryStatus,
    enum_values,
)

if TYPE_CHECKING:
    from app.models.meeting import ActionItem, Decision, Meeting, TranscriptSegment
    from app.models.user import User
    from app.models.workspace import Workspace


class AIProcessingRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ai_processing_runs"
    __table_args__ = (
        Index("ix_ai_processing_runs_workspace_id", "workspace_id"),
        Index("ix_ai_processing_runs_meeting_id", "meeting_id"),
        Index("ix_ai_processing_runs_workspace_meeting", "workspace_id", "meeting_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    stage: Mapped[AIProcessingStage] = mapped_column(
        SAEnum(AIProcessingStage, name="ai_processing_stage", values_callable=enum_values),
        nullable=False,
    )
    mode: Mapped[AIProcessingMode] = mapped_column(
        SAEnum(AIProcessingMode, name="ai_processing_mode", values_callable=enum_values),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(120), nullable=False)
    model: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(120), nullable=False)
    input_first_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="RESTRICT"), nullable=True
    )
    input_last_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="RESTRICT"), nullable=True
    )
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[ProcessingStatus] = mapped_column(
        SAEnum(ProcessingStatus, name="processing_status", values_callable=enum_values),
        nullable=False,
        default=ProcessingStatus.QUEUED,
    )
    error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(back_populates="processing_runs")
    input_first_segment: Mapped[TranscriptSegment | None] = relationship(
        foreign_keys=[input_first_segment_id]
    )
    input_last_segment: Mapped[TranscriptSegment | None] = relationship(
        foreign_keys=[input_last_segment_id]
    )
    summary_versions: Mapped[list[SummaryVersion]] = relationship(
        back_populates="processing_run"
    )
    action_items: Mapped[list[ActionItem]] = relationship(back_populates="processing_run")
    decisions: Mapped[list[Decision]] = relationship(back_populates="processing_run")


class SummaryVersion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "summary_versions"
    __table_args__ = (
        UniqueConstraint("meeting_id", "version", name="uq_summary_versions_meeting_version"),
        Index("ix_summary_versions_workspace_id", "workspace_id"),
        Index("ix_summary_versions_meeting_id", "meeting_id"),
        Index(
            "ix_summary_versions_workspace_meeting_created",
            "workspace_id",
            "meeting_id",
            "created_at",
        ),
        Index(
            "uq_summary_versions_current",
            "meeting_id",
            unique=True,
            postgresql_where=text("status = 'current'"),
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
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[SummaryKind] = mapped_column(
        SAEnum(SummaryKind, name="summary_kind", values_callable=enum_values), nullable=False
    )
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    key_points: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    status: Mapped[SummaryStatus] = mapped_column(
        SAEnum(SummaryStatus, name="summary_status", values_callable=enum_values),
        nullable=False,
        default=SummaryStatus.DRAFT,
    )
    edited_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship(
        back_populates="summary_versions", foreign_keys=[meeting_id]
    )
    processing_run: Mapped[AIProcessingRun | None] = relationship(
        back_populates="summary_versions"
    )
    edited_by: Mapped[User | None] = relationship()
    citations: Mapped[list[AIOutputCitation]] = relationship(
        back_populates="summary_version", cascade="all, delete-orphan"
    )
    feedback: Mapped[list[AIOutputFeedback]] = relationship(
        back_populates="summary_version", cascade="all, delete-orphan"
    )


class AIOutputCitation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ai_output_citations"
    __table_args__ = (
        CheckConstraint(
            "num_nonnulls(summary_version_id, action_item_id, decision_id) = 1",
            name="ck_ai_output_citations_exactly_one_output",
        ),
        Index("ix_ai_output_citations_workspace_id", "workspace_id"),
        Index("ix_ai_output_citations_meeting_id", "meeting_id"),
        Index("ix_ai_output_citations_segment_id", "transcript_segment_id"),
        Index("ix_ai_output_citations_summary_id", "summary_version_id"),
        Index("ix_ai_output_citations_action_id", "action_item_id"),
        Index("ix_ai_output_citations_decision_id", "decision_id"),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    transcript_segment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("transcript_segments.id", ondelete="CASCADE"), nullable=False
    )
    summary_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("summary_versions.id", ondelete="CASCADE"), nullable=True
    )
    action_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("action_items.id", ondelete="CASCADE"), nullable=True
    )
    decision_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=True
    )
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    text_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship()
    transcript_segment: Mapped[TranscriptSegment] = relationship(back_populates="citations")
    summary_version: Mapped[SummaryVersion | None] = relationship(back_populates="citations")
    action_item: Mapped[ActionItem | None] = relationship(back_populates="citations")
    decision: Mapped[Decision | None] = relationship(back_populates="citations")


class AIOutputFeedback(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ai_output_feedback"
    __table_args__ = (
        CheckConstraint(
            "num_nonnulls(summary_version_id, action_item_id, decision_id) = 1",
            name="ck_ai_output_feedback_exactly_one_output",
        ),
        Index("ix_ai_output_feedback_workspace_id", "workspace_id"),
        Index("ix_ai_output_feedback_meeting_id", "meeting_id"),
        Index(
            "uq_ai_output_feedback_summary_user",
            "user_id",
            "summary_version_id",
            unique=True,
            postgresql_where=text("summary_version_id IS NOT NULL"),
        ),
        Index(
            "uq_ai_output_feedback_action_user",
            "user_id",
            "action_item_id",
            unique=True,
            postgresql_where=text("action_item_id IS NOT NULL"),
        ),
        Index(
            "uq_ai_output_feedback_decision_user",
            "user_id",
            "decision_id",
            unique=True,
            postgresql_where=text("decision_id IS NOT NULL"),
        ),
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    summary_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("summary_versions.id", ondelete="CASCADE"), nullable=True
    )
    action_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("action_items.id", ondelete="CASCADE"), nullable=True
    )
    decision_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=True
    )
    rating: Mapped[FeedbackRating] = mapped_column(
        SAEnum(FeedbackRating, name="feedback_rating", values_callable=enum_values),
        nullable=False,
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    workspace: Mapped[Workspace] = relationship()
    meeting: Mapped[Meeting] = relationship()
    user: Mapped[User] = relationship()
    summary_version: Mapped[SummaryVersion | None] = relationship(back_populates="feedback")
    action_item: Mapped[ActionItem | None] = relationship(back_populates="feedback")
    decision: Mapped[Decision | None] = relationship(back_populates="feedback")
