"""Create initial MeetingMind schema.

Revision ID: 20260707_0001
Revises:
Create Date: 2026-07-07 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260707_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

workspace_role = postgresql.ENUM(
    "owner",
    "admin",
    "member",
    "viewer",
    name="workspace_role",
    create_type=False,
)
meeting_status = postgresql.ENUM(
    "scheduled",
    "recording",
    "transcribing",
    "analyzing",
    "completed",
    "failed",
    name="meeting_status",
    create_type=False,
)
meeting_source_type = postgresql.ENUM(
    "extension_capture",
    "standalone_web_capture",
    "recording_import",
    "bot_join",
    name="meeting_source_type",
    create_type=False,
)
meeting_source_app = postgresql.ENUM(
    "google_meet",
    "zoom_web",
    "teams_web",
    "standalone_web",
    "import",
    name="meeting_source_app",
    create_type=False,
)
action_item_status = postgresql.ENUM(
    "open",
    "completed",
    name="action_item_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            CREATE EXTENSION IF NOT EXISTS vector;
        EXCEPTION
            WHEN feature_not_supported OR undefined_file THEN
                RAISE NOTICE 'pgvector extension is not installed; skipping vector setup';
        END
        $$;
        """
    )
    op.execute("CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer')")
    op.execute(
        "CREATE TYPE meeting_status AS ENUM "
        "('scheduled', 'recording', 'transcribing', 'analyzing', 'completed', 'failed')"
    )
    op.execute(
        "CREATE TYPE meeting_source_type AS ENUM "
        "('extension_capture', 'standalone_web_capture', 'recording_import', 'bot_join')"
    )
    op.execute(
        "CREATE TYPE meeting_source_app AS ENUM "
        "('google_meet', 'zoom_web', 'teams_web', 'standalone_web', 'import')"
    )
    op.execute("CREATE TYPE action_item_status AS ENUM ('open', 'completed')")

    op.create_table(
        "users",
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=2048), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "workspaces",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("settings", sa.JSON(), nullable=False),
        sa.Column("raw_audio_retention_days", sa.Integer(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_workspaces_deleted_at", "workspaces", ["deleted_at"])
    op.create_index("ix_workspaces_slug", "workspaces", ["slug"])

    op.create_table(
        "meetings",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("status", meeting_status, nullable=False),
        sa.Column("source_type", meeting_source_type, nullable=False),
        sa.Column("source_app", meeting_source_app, nullable=True),
        sa.Column("client_type", sa.String(length=80), nullable=True),
        sa.Column("source_url", sa.String(length=2048), nullable=True),
        sa.Column("source_title", sa.String(length=255), nullable=True),
        sa.Column("visible_participants", sa.JSON(), nullable=True),
        sa.Column("media_url", sa.String(length=2048), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_audio_deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meetings_created_by_user_id", "meetings", ["created_by_user_id"])
    op.create_index("ix_meetings_workspace_id", "meetings", ["workspace_id"])
    op.create_index("ix_meetings_workspace_started_at", "meetings", ["workspace_id", "started_at"])
    op.create_index("ix_meetings_workspace_status", "meetings", ["workspace_id", "status"])

    op.create_table(
        "refresh_tokens",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_token_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["replaced_by_token_id"], ["refresh_tokens.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])
    op.create_index(
        "ix_refresh_tokens_token_hash",
        "refresh_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    op.create_table(
        "transcript_segments",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("speaker_label", sa.String(length=120), nullable=False),
        sa.Column("speaker_name", sa.String(length=255), nullable=True),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_final", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_transcript_segments_meeting_id",
        "transcript_segments",
        ["meeting_id"],
    )
    op.create_index(
        "ix_transcript_segments_meeting_start_time",
        "transcript_segments",
        ["meeting_id", "start_time"],
    )
    op.create_index(
        "ix_transcript_segments_workspace_id",
        "transcript_segments",
        ["workspace_id"],
    )

    op.create_table(
        "workspace_memberships",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("role", workspace_role, nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "user_id", name="uq_workspace_memberships_user"),
    )
    op.create_index(
        "ix_workspace_memberships_user_id",
        "workspace_memberships",
        ["user_id"],
    )
    op.create_index(
        "ix_workspace_memberships_workspace_id",
        "workspace_memberships",
        ["workspace_id"],
    )

    op.create_table(
        "action_items",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("source_segment_id", sa.Uuid(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("assignee_name", sa.String(length=255), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", action_item_status, nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
        sa.ForeignKeyConstraint(["source_segment_id"], ["transcript_segments.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_action_items_meeting_id", "action_items", ["meeting_id"])
    op.create_index("ix_action_items_status", "action_items", ["status"])
    op.create_index("ix_action_items_workspace_id", "action_items", ["workspace_id"])

    op.create_table(
        "decisions",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("source_segment_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
        sa.ForeignKeyConstraint(["source_segment_id"], ["transcript_segments.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_decisions_meeting_id", "decisions", ["meeting_id"])
    op.create_index("ix_decisions_workspace_id", "decisions", ["workspace_id"])


def downgrade() -> None:
    op.drop_index("ix_decisions_workspace_id", table_name="decisions")
    op.drop_index("ix_decisions_meeting_id", table_name="decisions")
    op.drop_table("decisions")

    op.drop_index("ix_action_items_workspace_id", table_name="action_items")
    op.drop_index("ix_action_items_status", table_name="action_items")
    op.drop_index("ix_action_items_meeting_id", table_name="action_items")
    op.drop_table("action_items")

    op.drop_index("ix_workspace_memberships_workspace_id", table_name="workspace_memberships")
    op.drop_index("ix_workspace_memberships_user_id", table_name="workspace_memberships")
    op.drop_table("workspace_memberships")

    op.drop_index("ix_transcript_segments_workspace_id", table_name="transcript_segments")
    op.drop_index("ix_transcript_segments_meeting_start_time", table_name="transcript_segments")
    op.drop_index("ix_transcript_segments_meeting_id", table_name="transcript_segments")
    op.drop_table("transcript_segments")

    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_expires_at", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

    op.drop_index("ix_meetings_workspace_status", table_name="meetings")
    op.drop_index("ix_meetings_workspace_started_at", table_name="meetings")
    op.drop_index("ix_meetings_workspace_id", table_name="meetings")
    op.drop_index("ix_meetings_created_by_user_id", table_name="meetings")
    op.drop_table("meetings")

    op.drop_index("ix_workspaces_slug", table_name="workspaces")
    op.drop_index("ix_workspaces_deleted_at", table_name="workspaces")
    op.drop_table("workspaces")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    action_item_status.drop(bind)
    meeting_source_app.drop(bind)
    meeting_source_type.drop(bind)
    meeting_status.drop(bind)
    workspace_role.drop(bind)
