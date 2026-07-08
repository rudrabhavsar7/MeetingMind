from __future__ import annotations

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Enum as SAEnum

from app.models import ActionItem, Meeting, WorkspaceMembership

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def test_alembic_has_single_initial_head() -> None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    script = ScriptDirectory.from_config(config)

    assert script.get_current_head() == "20260707_0001"


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
