"""align canonical data model

Revision ID: f7f4ecb2373b
Revises: 20260707_0001
Create Date: 2026-07-11 22:39:52.856361
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision: str = "f7f4ecb2373b"
down_revision: str | None = "20260707_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

workspace_role = postgresql.ENUM(
    "owner", "admin", "member", "viewer", name="workspace_role", create_type=False
)
media_kind = postgresql.ENUM(
    "import",
    "live_audio",
    "extracted_audio",
    "export",
    "avatar",
    name="media_kind",
    create_type=False,
)
media_status = postgresql.ENUM(
    "pending",
    "uploaded",
    "processing",
    "ready",
    "deleted",
    "failed",
    name="media_status",
    create_type=False,
)
ai_processing_stage = postgresql.ENUM(
    "summary",
    "action_items",
    "decisions",
    "embedding",
    "rag",
    name="ai_processing_stage",
    create_type=False,
)
ai_processing_mode = postgresql.ENUM(
    "rolling",
    "final",
    "batch",
    "backfill",
    name="ai_processing_mode",
    create_type=False,
)
processing_status = postgresql.ENUM(
    "queued",
    "running",
    "completed",
    "failed",
    name="processing_status",
    create_type=False,
)
summary_kind = postgresql.ENUM(
    "rolling", "final", "user_edited", name="summary_kind", create_type=False
)
summary_status = postgresql.ENUM(
    "draft", "current", "superseded", name="summary_status", create_type=False
)
feedback_rating = postgresql.ENUM("up", "down", name="feedback_rating", create_type=False)
output_origin = postgresql.ENUM("ai", "user", name="output_origin", create_type=False)

NEW_ENUMS = (
    media_kind,
    media_status,
    ai_processing_stage,
    ai_processing_mode,
    processing_status,
    summary_kind,
    summary_status,
    feedback_rating,
    output_origin,
)


def _create_new_enum_types() -> None:
    bind = op.get_bind()
    for enum_type in NEW_ENUMS:
        enum_type.create(bind, checkfirst=True)


def _ensure_pgvector() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            ) THEN
                RAISE EXCEPTION
                    'pgvector must be provisioned before running MeetingMind migrations';
            END IF;
        END $$
        """
    )
    op.execute(
        "SELECT set_config(" "'search_path', current_setting('search_path') || ',extensions', true)"
    )


def _drop_new_enum_types() -> None:
    bind = op.get_bind()
    for enum_type in reversed(NEW_ENUMS):
        enum_type.drop(bind, checkfirst=True)


def _replace_v1_enums() -> None:
    op.execute("ALTER TABLE meetings ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE meetings ALTER COLUMN source_type DROP DEFAULT")
    op.execute(
        "CREATE TYPE meeting_status_v2 AS ENUM "
        "('scheduled', 'recording', 'paused', 'transcribing', 'analyzing', "
        "'completed', 'failed')"
    )
    op.execute(
        "ALTER TABLE meetings ALTER COLUMN status TYPE meeting_status_v2 "
        "USING status::text::meeting_status_v2"
    )
    op.execute("DROP TYPE meeting_status")
    op.execute("ALTER TYPE meeting_status_v2 RENAME TO meeting_status")
    op.execute(
        "CREATE TYPE meeting_source_type_v2 AS ENUM "
        "('extension_capture', 'standalone_web_capture', 'recording_import')"
    )
    op.execute(
        "ALTER TABLE meetings ALTER COLUMN source_type TYPE meeting_source_type_v2 "
        "USING source_type::text::meeting_source_type_v2"
    )
    op.execute("DROP TYPE meeting_source_type")
    op.execute("ALTER TYPE meeting_source_type_v2 RENAME TO meeting_source_type")


def _restore_legacy_enums() -> None:
    op.execute("ALTER TABLE meetings ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE meetings ALTER COLUMN source_type DROP DEFAULT")
    op.execute(
        "CREATE TYPE meeting_status_v1 AS ENUM "
        "('scheduled', 'recording', 'transcribing', 'analyzing', 'completed', 'failed')"
    )
    op.execute(
        "ALTER TABLE meetings ALTER COLUMN status TYPE meeting_status_v1 "
        "USING status::text::meeting_status_v1"
    )
    op.execute("DROP TYPE meeting_status")
    op.execute("ALTER TYPE meeting_status_v1 RENAME TO meeting_status")
    op.execute(
        "CREATE TYPE meeting_source_type_v1 AS ENUM "
        "('extension_capture', 'standalone_web_capture', 'recording_import', 'bot_join')"
    )
    op.execute(
        "ALTER TABLE meetings ALTER COLUMN source_type TYPE meeting_source_type_v1 "
        "USING source_type::text::meeting_source_type_v1"
    )
    op.execute("DROP TYPE meeting_source_type")
    op.execute("ALTER TYPE meeting_source_type_v1 RENAME TO meeting_source_type")


def upgrade() -> None:
    _ensure_pgvector()
    _replace_v1_enums()
    _create_new_enum_types()
    op.create_table(
        "audit_logs",
        sa.Column("workspace_id", sa.Uuid(), nullable=True),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("resource_type", sa.String(length=120), nullable=False),
        sa.Column("resource_id", sa.Uuid(), nullable=True),
        sa.Column("request_id", sa.String(length=255), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"], unique=False)
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], unique=False)
    op.create_index("ix_audit_logs_workspace_id", "audit_logs", ["workspace_id"], unique=False)
    op.create_table(
        "extension_sessions",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("device_id", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("extension_version", sa.String(length=80), nullable=False),
        sa.Column("browser", sa.String(length=120), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
        sa.UniqueConstraint("user_id", "device_id", name="uq_extension_sessions_user_device"),
    )
    op.create_index(
        "ix_extension_sessions_expires_at", "extension_sessions", ["expires_at"], unique=False
    )
    op.create_index(
        "ix_extension_sessions_token_hash", "extension_sessions", ["token_hash"], unique=True
    )
    op.create_index(
        "ix_extension_sessions_user_id", "extension_sessions", ["user_id"], unique=False
    )
    op.create_index(
        "ix_extension_sessions_workspace_id", "extension_sessions", ["workspace_id"], unique=False
    )
    op.create_table(
        "password_reset_tokens",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        "ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"], unique=False
    )
    op.create_index(
        "ix_password_reset_tokens_token_hash", "password_reset_tokens", ["token_hash"], unique=True
    )
    op.create_index(
        "ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"], unique=False
    )
    op.create_table(
        "workspace_invitations",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("role", workspace_role, nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("invited_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role <> 'owner'", name="ck_workspace_invitations_non_owner_role"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        "ix_workspace_invitations_expires_at", "workspace_invitations", ["expires_at"], unique=False
    )
    op.create_index(
        "ix_workspace_invitations_token_hash", "workspace_invitations", ["token_hash"], unique=True
    )
    op.create_index(
        "ix_workspace_invitations_workspace_id",
        "workspace_invitations",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "uq_workspace_invitations_pending_email",
        "workspace_invitations",
        ["workspace_id", "email"],
        unique=True,
        postgresql_where=sa.text("accepted_at IS NULL AND revoked_at IS NULL"),
    )
    op.create_table(
        "media_objects",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("kind", media_kind, nullable=False),
        sa.Column("object_key", sa.String(length=2048), nullable=False),
        sa.Column("content_type", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column("retention_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", media_status, nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "object_key", name="uq_media_objects_object_key"),
    )
    op.create_index("ix_media_objects_meeting_id", "media_objects", ["meeting_id"], unique=False)
    op.create_index(
        "ix_media_objects_retention_until", "media_objects", ["retention_until"], unique=False
    )
    op.create_index(
        "ix_media_objects_workspace_id", "media_objects", ["workspace_id"], unique=False
    )
    op.create_table(
        "meeting_participants",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("source_participant_id", sa.String(length=255), nullable=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_meeting_participants_meeting_id", "meeting_participants", ["meeting_id"], unique=False
    )
    op.create_index(
        "ix_meeting_participants_workspace_id",
        "meeting_participants",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "uq_meeting_participants_source_id",
        "meeting_participants",
        ["meeting_id", "source_participant_id"],
        unique=True,
        postgresql_where=sa.text("source_participant_id IS NOT NULL"),
    )
    op.create_table(
        "ai_processing_runs",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("stage", ai_processing_stage, nullable=False),
        sa.Column("mode", ai_processing_mode, nullable=False),
        sa.Column("provider", sa.String(length=120), nullable=False),
        sa.Column("model", sa.String(length=255), nullable=False),
        sa.Column("prompt_version", sa.String(length=120), nullable=False),
        sa.Column("input_first_segment_id", sa.Uuid(), nullable=True),
        sa.Column("input_last_segment_id", sa.Uuid(), nullable=True),
        sa.Column("input_hash", sa.String(length=64), nullable=False),
        sa.Column("status", processing_status, nullable=False),
        sa.Column("error_code", sa.String(length=120), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["input_first_segment_id"], ["transcript_segments.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["input_last_segment_id"], ["transcript_segments.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_processing_runs_meeting_id", "ai_processing_runs", ["meeting_id"], unique=False
    )
    op.create_index(
        "ix_ai_processing_runs_workspace_id", "ai_processing_runs", ["workspace_id"], unique=False
    )
    op.create_index(
        "ix_ai_processing_runs_workspace_meeting",
        "ai_processing_runs",
        ["workspace_id", "meeting_id"],
        unique=False,
    )
    op.create_table(
        "transcript_chunks",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("first_segment_id", sa.Uuid(), nullable=False),
        sa.Column("last_segment_id", sa.Uuid(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("chunker_version", sa.String(length=80), nullable=False),
        sa.Column("embedding_model", sa.String(length=255), nullable=False),
        sa.Column("embedding_dimensions", sa.Integer(), nullable=False),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "embedding_dimensions = 768", name="ck_transcript_chunks_embedding_dimensions"
        ),
        sa.CheckConstraint(
            "start_time >= 0 AND end_time > start_time", name="ck_transcript_chunks_valid_timing"
        ),
        sa.ForeignKeyConstraint(
            ["first_segment_id"], ["transcript_segments.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["last_segment_id"], ["transcript_segments.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "meeting_id",
            "content_hash",
            "chunker_version",
            "embedding_model",
            name="uq_transcript_chunks_content_version",
        ),
    )
    op.create_index(
        "ix_transcript_chunks_embedding_hnsw",
        "transcript_chunks",
        ["embedding"],
        unique=False,
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.create_index(
        "ix_transcript_chunks_meeting_start_time",
        "transcript_chunks",
        ["meeting_id", "start_time"],
        unique=False,
    )
    op.create_index(
        "ix_transcript_chunks_workspace_meeting",
        "transcript_chunks",
        ["workspace_id", "meeting_id"],
        unique=False,
    )
    op.create_table(
        "summary_versions",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("ai_processing_run_id", sa.Uuid(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("kind", summary_kind, nullable=False),
        sa.Column("executive_summary", sa.Text(), nullable=False),
        sa.Column("key_points", postgresql.JSONB(), nullable=False),
        sa.Column("status", summary_status, nullable=False),
        sa.Column("edited_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["ai_processing_run_id"], ["ai_processing_runs.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["edited_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("meeting_id", "version", name="uq_summary_versions_meeting_version"),
    )
    op.create_index(
        "ix_summary_versions_meeting_id", "summary_versions", ["meeting_id"], unique=False
    )
    op.create_index(
        "ix_summary_versions_workspace_id", "summary_versions", ["workspace_id"], unique=False
    )
    op.create_index(
        "ix_summary_versions_workspace_meeting_created",
        "summary_versions",
        ["workspace_id", "meeting_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "uq_summary_versions_current",
        "summary_versions",
        ["meeting_id"],
        unique=True,
        postgresql_where=sa.text("status = 'current'"),
    )
    op.create_table(
        "ai_output_citations",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("transcript_segment_id", sa.Uuid(), nullable=False),
        sa.Column("summary_version_id", sa.Uuid(), nullable=True),
        sa.Column("action_item_id", sa.Uuid(), nullable=True),
        sa.Column("decision_id", sa.Uuid(), nullable=True),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("text_excerpt", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "num_nonnulls(summary_version_id, action_item_id, decision_id) = 1",
            name="ck_ai_output_citations_exactly_one_output",
        ),
        sa.ForeignKeyConstraint(["action_item_id"], ["action_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["summary_version_id"], ["summary_versions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["transcript_segment_id"], ["transcript_segments.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_output_citations_action_id", "ai_output_citations", ["action_item_id"], unique=False
    )
    op.create_index(
        "ix_ai_output_citations_decision_id", "ai_output_citations", ["decision_id"], unique=False
    )
    op.create_index(
        "ix_ai_output_citations_meeting_id", "ai_output_citations", ["meeting_id"], unique=False
    )
    op.create_index(
        "ix_ai_output_citations_segment_id",
        "ai_output_citations",
        ["transcript_segment_id"],
        unique=False,
    )
    op.create_index(
        "ix_ai_output_citations_summary_id",
        "ai_output_citations",
        ["summary_version_id"],
        unique=False,
    )
    op.create_index(
        "ix_ai_output_citations_workspace_id", "ai_output_citations", ["workspace_id"], unique=False
    )
    op.create_table(
        "ai_output_feedback",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("summary_version_id", sa.Uuid(), nullable=True),
        sa.Column("action_item_id", sa.Uuid(), nullable=True),
        sa.Column("decision_id", sa.Uuid(), nullable=True),
        sa.Column("rating", feedback_rating, nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "num_nonnulls(summary_version_id, action_item_id, decision_id) = 1",
            name="ck_ai_output_feedback_exactly_one_output",
        ),
        sa.ForeignKeyConstraint(["action_item_id"], ["action_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["summary_version_id"], ["summary_versions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_output_feedback_meeting_id", "ai_output_feedback", ["meeting_id"], unique=False
    )
    op.create_index(
        "ix_ai_output_feedback_workspace_id", "ai_output_feedback", ["workspace_id"], unique=False
    )
    op.create_index(
        "uq_ai_output_feedback_action_user",
        "ai_output_feedback",
        ["user_id", "action_item_id"],
        unique=True,
        postgresql_where=sa.text("action_item_id IS NOT NULL"),
    )
    op.create_index(
        "uq_ai_output_feedback_decision_user",
        "ai_output_feedback",
        ["user_id", "decision_id"],
        unique=True,
        postgresql_where=sa.text("decision_id IS NOT NULL"),
    )
    op.create_index(
        "uq_ai_output_feedback_summary_user",
        "ai_output_feedback",
        ["user_id", "summary_version_id"],
        unique=True,
        postgresql_where=sa.text("summary_version_id IS NOT NULL"),
    )
    op.add_column("action_items", sa.Column("ai_processing_run_id", sa.Uuid(), nullable=True))
    op.add_column("action_items", sa.Column("assignee_user_id", sa.Uuid(), nullable=True))
    op.add_column(
        "action_items",
        sa.Column("origin", output_origin, server_default="ai", nullable=False),
    )
    op.add_column("action_items", sa.Column("confidence_score", sa.Float(), nullable=True))
    op.add_column(
        "action_items", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("action_items", sa.Column("updated_by_user_id", sa.Uuid(), nullable=True))
    op.add_column(
        "action_items", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(
        "ix_action_items_workspace_meeting_created",
        "action_items",
        ["workspace_id", "meeting_id", "created_at"],
        unique=False,
    )
    op.execute(
        """
        INSERT INTO ai_output_citations (
            id, workspace_id, meeting_id, transcript_segment_id, action_item_id,
            start_time, end_time, created_at, updated_at
        )
        SELECT gen_random_uuid(), a.workspace_id, a.meeting_id, a.source_segment_id, a.id,
               s.start_time, s.end_time, now(), now()
        FROM action_items AS a
        JOIN transcript_segments AS s ON s.id = a.source_segment_id
        WHERE a.source_segment_id IS NOT NULL
        """
    )
    op.drop_constraint(op.f("action_items_workspace_id_fkey"), "action_items", type_="foreignkey")
    op.drop_constraint(op.f("action_items_meeting_id_fkey"), "action_items", type_="foreignkey")
    op.drop_constraint(
        op.f("action_items_source_segment_id_fkey"), "action_items", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_action_items_updated_by_user_id_users",
        "action_items",
        "users",
        ["updated_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_action_items_assignee_user_id_users",
        "action_items",
        "users",
        ["assignee_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_action_items_meeting_id_meetings",
        "action_items",
        "meetings",
        ["meeting_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_action_items_ai_processing_run_id_runs",
        "action_items",
        "ai_processing_runs",
        ["ai_processing_run_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_action_items_workspace_id_workspaces",
        "action_items",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_column("action_items", "source_segment_id")
    op.add_column("decisions", sa.Column("ai_processing_run_id", sa.Uuid(), nullable=True))
    op.add_column(
        "decisions",
        sa.Column("origin", output_origin, server_default="ai", nullable=False),
    )
    op.add_column("decisions", sa.Column("confidence_score", sa.Float(), nullable=True))
    op.add_column("decisions", sa.Column("updated_by_user_id", sa.Uuid(), nullable=True))
    op.add_column("decisions", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(
        "ix_decisions_workspace_meeting_created",
        "decisions",
        ["workspace_id", "meeting_id", "created_at"],
        unique=False,
    )
    op.execute(
        """
        INSERT INTO ai_output_citations (
            id, workspace_id, meeting_id, transcript_segment_id, decision_id,
            start_time, end_time, created_at, updated_at
        )
        SELECT gen_random_uuid(), d.workspace_id, d.meeting_id, d.source_segment_id, d.id,
               s.start_time, s.end_time, now(), now()
        FROM decisions AS d
        JOIN transcript_segments AS s ON s.id = d.source_segment_id
        WHERE d.source_segment_id IS NOT NULL
        """
    )
    op.drop_constraint(op.f("decisions_source_segment_id_fkey"), "decisions", type_="foreignkey")
    op.drop_constraint(op.f("decisions_meeting_id_fkey"), "decisions", type_="foreignkey")
    op.drop_constraint(op.f("decisions_workspace_id_fkey"), "decisions", type_="foreignkey")
    op.create_foreign_key(
        "fk_decisions_meeting_id_meetings",
        "decisions",
        "meetings",
        ["meeting_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_decisions_workspace_id_workspaces",
        "decisions",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_decisions_updated_by_user_id_users",
        "decisions",
        "users",
        ["updated_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_decisions_ai_processing_run_id_runs",
        "decisions",
        "ai_processing_runs",
        ["ai_processing_run_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_column("decisions", "source_segment_id")
    op.add_column("meetings", sa.Column("current_summary_version_id", sa.Uuid(), nullable=True))
    op.add_column(
        "meetings",
        sa.Column("raw_audio_retained", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("meetings", sa.Column("last_error_code", sa.String(length=120), nullable=True))
    op.add_column(
        "meetings", sa.Column("last_error_message", sa.String(length=1000), nullable=True)
    )
    op.execute(
        """
        UPDATE meetings AS m
        SET created_by_user_id = (
            SELECT wm.user_id
            FROM workspace_memberships AS wm
            WHERE wm.workspace_id = m.workspace_id
            ORDER BY CASE WHEN wm.role = 'owner' THEN 0 ELSE 1 END, wm.created_at
            LIMIT 1
        )
        WHERE m.created_by_user_id IS NULL
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM meetings WHERE created_by_user_id IS NULL) THEN
                RAISE EXCEPTION
                    'Cannot require meetings.created_by_user_id: meeting has no workspace member';
            END IF;
        END $$
        """
    )
    op.execute("UPDATE meetings SET started_at = created_at WHERE started_at IS NULL")
    op.alter_column("meetings", "created_by_user_id", existing_type=sa.UUID(), nullable=False)
    op.alter_column(
        "meetings", "started_at", existing_type=postgresql.TIMESTAMP(timezone=True), nullable=False
    )
    op.drop_constraint(op.f("meetings_workspace_id_fkey"), "meetings", type_="foreignkey")
    op.drop_constraint(op.f("meetings_created_by_user_id_fkey"), "meetings", type_="foreignkey")
    op.create_foreign_key(
        "fk_meetings_workspace_id_workspaces",
        "meetings",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_meetings_created_by_user_id_users",
        "meetings",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_meetings_current_summary_version_id",
        "meetings",
        "summary_versions",
        ["current_summary_version_id"],
        ["id"],
        ondelete="SET NULL",
        use_alter=True,
    )
    op.execute(
        """
        INSERT INTO summary_versions (
            id, workspace_id, meeting_id, ai_processing_run_id, version, kind,
            executive_summary, key_points, status, edited_by_user_id, created_at, updated_at
        )
        SELECT gen_random_uuid(), workspace_id, id, NULL, 1, 'final', summary,
               '[]'::json, 'current', NULL, created_at, updated_at
        FROM meetings
        WHERE summary IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE meetings AS m
        SET current_summary_version_id = s.id
        FROM summary_versions AS s
        WHERE s.meeting_id = m.id AND s.version = 1 AND m.summary IS NOT NULL
        """
    )
    op.execute(
        """
        INSERT INTO meeting_participants (
            id, workspace_id, meeting_id, source_participant_id, display_name, user_id,
            first_seen_at, last_seen_at, metadata, created_at, updated_at
        )
        SELECT gen_random_uuid(), m.workspace_id, m.id,
               participant.value->>'id',
               COALESCE(
                   participant.value->>'display_name',
                   participant.value->>'name',
                   'Unknown participant'
               ),
               NULL,
               m.started_at,
               COALESCE(m.ended_at, m.started_at),
               participant.value,
               m.created_at,
               m.updated_at
        FROM meetings AS m
        CROSS JOIN LATERAL json_array_elements(
            CASE
                WHEN json_typeof(m.visible_participants) = 'array'
                THEN m.visible_participants
                ELSE '[]'::json
            END
        ) AS participant(value)
        WHERE m.visible_participants IS NOT NULL
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM meetings WHERE media_url IS NOT NULL) THEN
                RAISE EXCEPTION
                    'Legacy meetings.media_url values must be converted to private object keys';
            END IF;
        END $$
        """
    )
    op.drop_column("meetings", "media_url")
    op.drop_column("meetings", "raw_audio_deleted_at")
    op.drop_column("meetings", "client_type")
    op.drop_column("meetings", "summary")
    op.drop_column("meetings", "visible_participants")
    op.drop_constraint(op.f("refresh_tokens_user_id_fkey"), "refresh_tokens", type_="foreignkey")
    op.drop_constraint(
        op.f("refresh_tokens_replaced_by_token_id_fkey"), "refresh_tokens", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_refresh_tokens_user_id_users",
        "refresh_tokens",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_refresh_tokens_replaced_by_token_id",
        "refresh_tokens",
        "refresh_tokens",
        ["replaced_by_token_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.add_column(
        "transcript_segments",
        sa.Column(
            "client_instance_id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
    )
    op.add_column("transcript_segments", sa.Column("stt_confidence", sa.Float(), nullable=True))
    op.add_column("transcript_segments", sa.Column("language", sa.String(length=32), nullable=True))
    op.add_column(
        "transcript_segments", sa.Column("supersedes_segment_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "transcript_segments",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.add_column(
        "transcript_segments",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_transcript_segments_valid_timing",
        "transcript_segments",
        "start_time >= 0 AND end_time > start_time",
    )
    op.create_unique_constraint(
        "uq_transcript_segments_stream_sequence",
        "transcript_segments",
        ["meeting_id", "client_instance_id", "sequence_number"],
    )
    op.drop_constraint(
        op.f("transcript_segments_workspace_id_fkey"), "transcript_segments", type_="foreignkey"
    )
    op.drop_constraint(
        op.f("transcript_segments_meeting_id_fkey"), "transcript_segments", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_transcript_segments_supersedes_segment_id",
        "transcript_segments",
        "transcript_segments",
        ["supersedes_segment_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_transcript_segments_meeting_id_meetings",
        "transcript_segments",
        "meetings",
        ["meeting_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_transcript_segments_workspace_id_workspaces",
        "transcript_segments",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.add_column("users", sa.Column("avatar_object_key", sa.String(length=2048), nullable=True))
    op.add_column(
        "users", sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False)
    )
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM users WHERE avatar_url IS NOT NULL) THEN
                RAISE EXCEPTION
                    'Legacy users.avatar_url values must be converted to private object keys';
            END IF;
        END $$
        """
    )
    op.drop_column("users", "avatar_url")
    op.drop_constraint(
        op.f("workspace_memberships_workspace_id_fkey"), "workspace_memberships", type_="foreignkey"
    )
    op.drop_constraint(
        op.f("workspace_memberships_user_id_fkey"), "workspace_memberships", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_workspace_memberships_workspace_id",
        "workspace_memberships",
        "workspaces",
        ["workspace_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_workspace_memberships_user_id",
        "workspace_memberships",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.alter_column(
        "workspaces",
        "settings",
        existing_type=postgresql.JSON(),
        type_=postgresql.JSONB(),
        postgresql_using="settings::jsonb",
    )
    op.add_column(
        "workspaces",
        sa.Column("is_default", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.execute(
        """
        UPDATE workspaces
        SET is_default = (id = (
            SELECT id FROM workspaces WHERE deleted_at IS NULL ORDER BY created_at, id LIMIT 1
        ))
        """
    )
    op.create_index(
        "uq_workspaces_single_default",
        "workspaces",
        ["is_default"],
        unique=True,
        postgresql_where=sa.text("is_default"),
    )

    op.alter_column("action_items", "origin", server_default=None)
    op.alter_column("decisions", "origin", server_default=None)
    op.alter_column("meetings", "raw_audio_retained", server_default=None)
    op.alter_column("transcript_segments", "client_instance_id", server_default=None)
    op.alter_column("transcript_segments", "created_at", server_default=None)
    op.alter_column("transcript_segments", "updated_at", server_default=None)
    op.alter_column("users", "is_active", server_default=None)
    op.alter_column("workspaces", "is_default", server_default=None)


def downgrade() -> None:
    _restore_legacy_enums()
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index("uq_workspaces_single_default", table_name="workspaces")
    op.drop_column("workspaces", "is_default")
    op.alter_column(
        "workspaces",
        "settings",
        existing_type=postgresql.JSONB(),
        type_=postgresql.JSON(),
        postgresql_using="settings::json",
    )
    op.drop_constraint(
        "fk_workspace_memberships_user_id", "workspace_memberships", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_workspace_memberships_workspace_id", "workspace_memberships", type_="foreignkey"
    )
    op.create_foreign_key(
        op.f("workspace_memberships_user_id_fkey"),
        "workspace_memberships",
        "users",
        ["user_id"],
        ["id"],
    )
    op.create_foreign_key(
        op.f("workspace_memberships_workspace_id_fkey"),
        "workspace_memberships",
        "workspaces",
        ["workspace_id"],
        ["id"],
    )
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.VARCHAR(length=2048), autoincrement=False, nullable=True),
    )
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "is_active")
    op.drop_column("users", "avatar_object_key")
    op.drop_constraint("ck_transcript_segments_valid_timing", "transcript_segments", type_="check")
    op.drop_constraint(
        "fk_transcript_segments_supersedes_segment_id", "transcript_segments", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_transcript_segments_meeting_id_meetings", "transcript_segments", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_transcript_segments_workspace_id_workspaces", "transcript_segments", type_="foreignkey"
    )
    op.create_foreign_key(
        op.f("transcript_segments_meeting_id_fkey"),
        "transcript_segments",
        "meetings",
        ["meeting_id"],
        ["id"],
    )
    op.create_foreign_key(
        op.f("transcript_segments_workspace_id_fkey"),
        "transcript_segments",
        "workspaces",
        ["workspace_id"],
        ["id"],
    )
    op.drop_constraint(
        "uq_transcript_segments_stream_sequence", "transcript_segments", type_="unique"
    )
    op.drop_column("transcript_segments", "updated_at")
    op.drop_column("transcript_segments", "created_at")
    op.drop_column("transcript_segments", "supersedes_segment_id")
    op.drop_column("transcript_segments", "language")
    op.drop_column("transcript_segments", "stt_confidence")
    op.drop_column("transcript_segments", "client_instance_id")
    op.drop_constraint(
        "fk_refresh_tokens_replaced_by_token_id", "refresh_tokens", type_="foreignkey"
    )
    op.drop_constraint("fk_refresh_tokens_user_id_users", "refresh_tokens", type_="foreignkey")
    op.create_foreign_key(
        op.f("refresh_tokens_replaced_by_token_id_fkey"),
        "refresh_tokens",
        "refresh_tokens",
        ["replaced_by_token_id"],
        ["id"],
    )
    op.create_foreign_key(
        op.f("refresh_tokens_user_id_fkey"), "refresh_tokens", "users", ["user_id"], ["id"]
    )
    op.add_column(
        "meetings",
        sa.Column(
            "visible_participants",
            postgresql.JSON(astext_type=sa.Text()),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column("meetings", sa.Column("summary", sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column(
        "meetings",
        sa.Column("client_type", sa.VARCHAR(length=80), autoincrement=False, nullable=True),
    )
    op.add_column(
        "meetings",
        sa.Column(
            "raw_audio_deleted_at",
            postgresql.TIMESTAMP(timezone=True),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.add_column(
        "meetings",
        sa.Column("media_url", sa.VARCHAR(length=2048), autoincrement=False, nullable=True),
    )
    op.execute(
        """
        UPDATE meetings AS meeting
        SET summary = summary_version.executive_summary
        FROM summary_versions AS summary_version
        WHERE summary_version.id = meeting.current_summary_version_id
        """
    )
    op.execute(
        """
        UPDATE meetings AS meeting
        SET visible_participants = participants.payload
        FROM (
            SELECT
                meeting_id,
                json_agg(
                    json_build_object(
                        'id', source_participant_id,
                        'name', display_name
                    )
                    ORDER BY first_seen_at, id
                ) AS payload
            FROM meeting_participants
            GROUP BY meeting_id
        ) AS participants
        WHERE participants.meeting_id = meeting.id
        """
    )
    op.drop_constraint("fk_meetings_current_summary_version_id", "meetings", type_="foreignkey")
    op.drop_constraint("fk_meetings_created_by_user_id_users", "meetings", type_="foreignkey")
    op.drop_constraint("fk_meetings_workspace_id_workspaces", "meetings", type_="foreignkey")
    op.create_foreign_key(
        op.f("meetings_created_by_user_id_fkey"),
        "meetings",
        "users",
        ["created_by_user_id"],
        ["id"],
    )
    op.create_foreign_key(
        op.f("meetings_workspace_id_fkey"), "meetings", "workspaces", ["workspace_id"], ["id"]
    )
    op.alter_column(
        "meetings", "started_at", existing_type=postgresql.TIMESTAMP(timezone=True), nullable=True
    )
    op.alter_column("meetings", "created_by_user_id", existing_type=sa.UUID(), nullable=True)
    op.drop_column("meetings", "last_error_message")
    op.drop_column("meetings", "last_error_code")
    op.drop_column("meetings", "raw_audio_retained")
    op.drop_column("meetings", "current_summary_version_id")
    op.add_column(
        "decisions", sa.Column("source_segment_id", sa.UUID(), autoincrement=False, nullable=True)
    )
    op.execute(
        """
        UPDATE decisions AS decision
        SET source_segment_id = (
            SELECT transcript_segment_id
            FROM ai_output_citations
            WHERE decision_id = decision.id
            ORDER BY start_time, id
            LIMIT 1
        )
        """
    )
    op.drop_constraint("fk_decisions_ai_processing_run_id_runs", "decisions", type_="foreignkey")
    op.drop_constraint("fk_decisions_updated_by_user_id_users", "decisions", type_="foreignkey")
    op.drop_constraint("fk_decisions_workspace_id_workspaces", "decisions", type_="foreignkey")
    op.drop_constraint("fk_decisions_meeting_id_meetings", "decisions", type_="foreignkey")
    op.create_foreign_key(
        op.f("decisions_workspace_id_fkey"), "decisions", "workspaces", ["workspace_id"], ["id"]
    )
    op.create_foreign_key(
        op.f("decisions_meeting_id_fkey"), "decisions", "meetings", ["meeting_id"], ["id"]
    )
    op.create_foreign_key(
        op.f("decisions_source_segment_id_fkey"),
        "decisions",
        "transcript_segments",
        ["source_segment_id"],
        ["id"],
    )
    op.drop_index("ix_decisions_workspace_meeting_created", table_name="decisions")
    op.drop_column("decisions", "deleted_at")
    op.drop_column("decisions", "updated_by_user_id")
    op.drop_column("decisions", "confidence_score")
    op.drop_column("decisions", "origin")
    op.drop_column("decisions", "ai_processing_run_id")
    op.add_column(
        "action_items",
        sa.Column("source_segment_id", sa.UUID(), autoincrement=False, nullable=True),
    )
    op.execute(
        """
        UPDATE action_items AS action_item
        SET source_segment_id = (
            SELECT transcript_segment_id
            FROM ai_output_citations
            WHERE action_item_id = action_item.id
            ORDER BY start_time, id
            LIMIT 1
        )
        """
    )
    op.drop_constraint(
        "fk_action_items_ai_processing_run_id_runs", "action_items", type_="foreignkey"
    )
    op.drop_constraint("fk_action_items_assignee_user_id_users", "action_items", type_="foreignkey")
    op.drop_constraint(
        "fk_action_items_updated_by_user_id_users", "action_items", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_action_items_workspace_id_workspaces", "action_items", type_="foreignkey"
    )
    op.drop_constraint("fk_action_items_meeting_id_meetings", "action_items", type_="foreignkey")
    op.create_foreign_key(
        op.f("action_items_source_segment_id_fkey"),
        "action_items",
        "transcript_segments",
        ["source_segment_id"],
        ["id"],
    )
    op.create_foreign_key(
        op.f("action_items_meeting_id_fkey"), "action_items", "meetings", ["meeting_id"], ["id"]
    )
    op.create_foreign_key(
        op.f("action_items_workspace_id_fkey"),
        "action_items",
        "workspaces",
        ["workspace_id"],
        ["id"],
    )
    op.drop_index("ix_action_items_workspace_meeting_created", table_name="action_items")
    op.drop_column("action_items", "deleted_at")
    op.drop_column("action_items", "updated_by_user_id")
    op.drop_column("action_items", "completed_at")
    op.drop_column("action_items", "confidence_score")
    op.drop_column("action_items", "origin")
    op.drop_column("action_items", "assignee_user_id")
    op.drop_column("action_items", "ai_processing_run_id")
    op.drop_index(
        "uq_ai_output_feedback_summary_user",
        table_name="ai_output_feedback",
        postgresql_where=sa.text("summary_version_id IS NOT NULL"),
    )
    op.drop_index(
        "uq_ai_output_feedback_decision_user",
        table_name="ai_output_feedback",
        postgresql_where=sa.text("decision_id IS NOT NULL"),
    )
    op.drop_index(
        "uq_ai_output_feedback_action_user",
        table_name="ai_output_feedback",
        postgresql_where=sa.text("action_item_id IS NOT NULL"),
    )
    op.drop_index("ix_ai_output_feedback_workspace_id", table_name="ai_output_feedback")
    op.drop_index("ix_ai_output_feedback_meeting_id", table_name="ai_output_feedback")
    op.drop_table("ai_output_feedback")
    op.drop_index("ix_ai_output_citations_workspace_id", table_name="ai_output_citations")
    op.drop_index("ix_ai_output_citations_summary_id", table_name="ai_output_citations")
    op.drop_index("ix_ai_output_citations_segment_id", table_name="ai_output_citations")
    op.drop_index("ix_ai_output_citations_meeting_id", table_name="ai_output_citations")
    op.drop_index("ix_ai_output_citations_decision_id", table_name="ai_output_citations")
    op.drop_index("ix_ai_output_citations_action_id", table_name="ai_output_citations")
    op.drop_table("ai_output_citations")
    op.drop_index(
        "uq_summary_versions_current",
        table_name="summary_versions",
        postgresql_where=sa.text("status = 'current'"),
    )
    op.drop_index("ix_summary_versions_workspace_meeting_created", table_name="summary_versions")
    op.drop_index("ix_summary_versions_workspace_id", table_name="summary_versions")
    op.drop_index("ix_summary_versions_meeting_id", table_name="summary_versions")
    op.drop_table("summary_versions")
    op.drop_index("ix_transcript_chunks_workspace_meeting", table_name="transcript_chunks")
    op.drop_index("ix_transcript_chunks_meeting_start_time", table_name="transcript_chunks")
    op.drop_index(
        "ix_transcript_chunks_embedding_hnsw",
        table_name="transcript_chunks",
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.drop_table("transcript_chunks")
    op.drop_index("ix_ai_processing_runs_workspace_meeting", table_name="ai_processing_runs")
    op.drop_index("ix_ai_processing_runs_workspace_id", table_name="ai_processing_runs")
    op.drop_index("ix_ai_processing_runs_meeting_id", table_name="ai_processing_runs")
    op.drop_table("ai_processing_runs")
    op.drop_index(
        "uq_meeting_participants_source_id",
        table_name="meeting_participants",
        postgresql_where=sa.text("source_participant_id IS NOT NULL"),
    )
    op.drop_index("ix_meeting_participants_workspace_id", table_name="meeting_participants")
    op.drop_index("ix_meeting_participants_meeting_id", table_name="meeting_participants")
    op.drop_table("meeting_participants")
    op.drop_index("ix_media_objects_workspace_id", table_name="media_objects")
    op.drop_index("ix_media_objects_retention_until", table_name="media_objects")
    op.drop_index("ix_media_objects_meeting_id", table_name="media_objects")
    op.drop_table("media_objects")
    op.drop_index(
        "uq_workspace_invitations_pending_email",
        table_name="workspace_invitations",
        postgresql_where=sa.text("accepted_at IS NULL AND revoked_at IS NULL"),
    )
    op.drop_index("ix_workspace_invitations_workspace_id", table_name="workspace_invitations")
    op.drop_index("ix_workspace_invitations_token_hash", table_name="workspace_invitations")
    op.drop_index("ix_workspace_invitations_expires_at", table_name="workspace_invitations")
    op.drop_table("workspace_invitations")
    op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_token_hash", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_expires_at", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_index("ix_extension_sessions_workspace_id", table_name="extension_sessions")
    op.drop_index("ix_extension_sessions_user_id", table_name="extension_sessions")
    op.drop_index("ix_extension_sessions_token_hash", table_name="extension_sessions")
    op.drop_index("ix_extension_sessions_expires_at", table_name="extension_sessions")
    op.drop_table("extension_sessions")
    op.drop_index("ix_audit_logs_workspace_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    _drop_new_enum_types()
    # ### end Alembic commands ###
