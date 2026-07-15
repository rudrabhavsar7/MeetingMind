from __future__ import annotations

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Enum as SAEnum

from app.models import ActionItem, Meeting, WorkspaceMembership

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def test_alembic_has_single_canonical_model_head() -> None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    script = ScriptDirectory.from_config(config)

    assert script.get_current_head() == "f7f4ecb2373b"


def test_initial_revision_includes_core_tables() -> None:
    migration = BACKEND_ROOT / "migrations" / "versions" / "20260707_0001_initial_schema.py"
    migration_text = migration.read_text(encoding="utf-8")

    for table_name in [
        "users",
        "workspaces",
        "workspace_memberships",
        "meetings",
        "refresh_tokens",
        "transcript_segments",
        "action_items",
        "decisions",
    ]:
        assert f'"{table_name}"' in migration_text


def test_canonical_model_revision_includes_required_storage() -> None:
    migration = (
        BACKEND_ROOT
        / "migrations"
        / "versions"
        / "f7f4ecb2373b_align_canonical_data_model.py"
    )
    migration_text = migration.read_text(encoding="utf-8")

    for table_name in [
        "workspace_invitations",
        "extension_sessions",
        "password_reset_tokens",
        "media_objects",
        "meeting_participants",
        "ai_processing_runs",
        "transcript_chunks",
        "summary_versions",
        "ai_output_citations",
        "ai_output_feedback",
        "audit_logs",
    ]:
        assert f'"{table_name}"' in migration_text

    assert "Vector(768)" in migration_text
    assert 'postgresql_using="hnsw"' in migration_text
    assert 'sa.Column("object_key"' in migration_text
    assert "FROM pg_extension WHERE extname = 'vector'" in migration_text
    assert "pgvector must be provisioned before running MeetingMind migrations" in migration_text


def test_orm_enums_persist_lowercase_values() -> None:
    role_column = WorkspaceMembership.__table__.c.role
    status_column = Meeting.__table__.c.status
    source_type_column = Meeting.__table__.c.source_type
    action_status_column = ActionItem.__table__.c.status

    for column_type in [
        role_column.type,
        status_column.type,
        source_type_column.type,
        action_status_column.type,
    ]:
        assert isinstance(column_type, SAEnum)
        assert all(value == value.lower() for value in column_type.enums)
