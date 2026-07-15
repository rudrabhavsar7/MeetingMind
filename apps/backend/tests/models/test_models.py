from __future__ import annotations

import uuid
from typing import Protocol, cast

from sqlalchemy import CheckConstraint, Table
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.schema import ColumnDefault

import app.models  # noqa: F401
from app.db.base import Base
from app.models import (
    ActionItem,
    ActionItemStatus,
    AIOutputCitation,
    Decision,
    Meeting,
    MeetingSourceApp,
    MeetingSourceType,
    MeetingStatus,
    TranscriptSegment,
    User,
    Workspace,
    WorkspaceMembership,
    WorkspaceRole,
)


class CallableWithSqlAlchemyContext(Protocol):
    def __call__(self, context: object | None) -> uuid.UUID: ...


def _table(model: type[Base]) -> Table:
    return cast(Table, model.__table__)


def test_identity_and_session_models_are_registered_with_metadata() -> None:
    assert {
        "users",
        "workspaces",
        "workspace_memberships",
        "workspace_invitations",
        "password_reset_tokens",
        "refresh_tokens",
        "extension_sessions",
    }.issubset(Base.metadata.tables)


def test_meeting_evidence_models_are_registered_with_metadata() -> None:
    assert {
        "meetings",
        "meeting_participants",
        "media_objects",
        "transcript_segments",
        "transcript_chunks",
    }.issubset(Base.metadata.tables)


def test_ai_output_and_audit_models_are_registered_with_metadata() -> None:
    assert {
        "ai_processing_runs",
        "summary_versions",
        "action_items",
        "decisions",
        "ai_output_citations",
        "ai_output_feedback",
        "audit_logs",
    }.issubset(Base.metadata.tables)


def test_identity_roots_expose_canonical_lifecycle_fields() -> None:
    user_columns = _table(User).c
    workspace_columns = _table(Workspace).c

    assert {"avatar_object_key", "is_active", "deleted_at"}.issubset(user_columns.keys())
    assert "avatar_url" not in user_columns
    assert "is_default" in workspace_columns.keys()


def test_public_models_use_uuid_primary_key_defaults() -> None:
    for table in Base.metadata.tables.values():
        if "id" not in table.c:
            continue
        default = table.c.id.default
        assert isinstance(default, ColumnDefault), table.name
        assert callable(default.arg), table.name
        default_factory = cast("CallableWithSqlAlchemyContext", default.arg)
        assert isinstance(default_factory(None), uuid.UUID), table.name


def test_tenant_scoped_models_include_workspace_foreign_key() -> None:
    tenant_tables = {
        "workspace_memberships",
        "workspace_invitations",
        "extension_sessions",
        "meetings",
        "meeting_participants",
        "media_objects",
        "transcript_segments",
        "transcript_chunks",
        "ai_processing_runs",
        "summary_versions",
        "action_items",
        "decisions",
        "ai_output_citations",
        "ai_output_feedback",
    }

    for table_name in tenant_tables:
        workspace_id = Base.metadata.tables[table_name].c.workspace_id

        assert workspace_id.foreign_keys
        assert any(
            foreign_key.target_fullname == "workspaces.id"
            for foreign_key in workspace_id.foreign_keys
        )


def test_token_models_store_hashes_and_lifecycle_timestamps_only() -> None:
    for table_name, lifecycle_columns in {
        "workspace_invitations": {"expires_at", "accepted_at", "revoked_at"},
        "password_reset_tokens": {"expires_at", "used_at", "revoked_at"},
        "refresh_tokens": {"expires_at", "revoked_at"},
        "extension_sessions": {"expires_at", "revoked_at"},
    }.items():
        columns = Base.metadata.tables[table_name].c
        assert "token_hash" in columns.keys()
        assert "token" not in columns.keys()
        assert "raw_token" not in columns.keys()
        assert lifecycle_columns.issubset(columns.keys())


def test_durable_storage_uses_private_object_keys_and_versioned_outputs() -> None:
    meeting_columns = _table(Meeting).c
    media_columns = Base.metadata.tables["media_objects"].c
    segment_columns = _table(TranscriptSegment).c
    chunk_columns = Base.metadata.tables["transcript_chunks"].c

    assert "media_url" not in meeting_columns.keys()
    assert "summary" not in meeting_columns.keys()
    assert "current_summary_version_id" in meeting_columns.keys()
    assert "object_key" in media_columns.keys()
    assert "embedding" not in segment_columns.keys()
    assert "embedding" in chunk_columns.keys()


def test_structured_canonical_fields_use_postgresql_jsonb() -> None:
    jsonb_columns = {
        "workspaces": "settings",
        "meeting_participants": "metadata",
        "summary_versions": "key_points",
        "audit_logs": "metadata",
    }

    for table_name, column_name in jsonb_columns.items():
        assert isinstance(Base.metadata.tables[table_name].c[column_name].type, JSONB)


def test_core_indexes_exist_for_common_queries() -> None:
    meeting_indexes = {index.name for index in _table(Meeting).indexes}
    transcript_indexes = {index.name for index in _table(TranscriptSegment).indexes}
    action_item_indexes = {index.name for index in _table(ActionItem).indexes}

    assert "ix_meetings_workspace_started_at" in meeting_indexes
    assert "ix_meetings_workspace_status" in meeting_indexes
    assert "ix_transcript_segments_meeting_start_time" in transcript_indexes
    assert "ix_action_items_status" in action_item_indexes


def test_database_constraints_guard_evidence_and_ai_output_shape() -> None:
    segment_checks = {
        constraint.name
        for constraint in _table(TranscriptSegment).constraints
        if isinstance(constraint, CheckConstraint)
    }
    chunk_checks = {
        constraint.name
        for constraint in Base.metadata.tables["transcript_chunks"].constraints
        if isinstance(constraint, CheckConstraint)
    }
    citation_checks = {
        constraint.name
        for constraint in _table(AIOutputCitation).constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert "ck_transcript_segments_valid_timing" in segment_checks
    assert "ck_transcript_chunks_embedding_dimensions" in chunk_checks
    assert "ck_ai_output_citations_exactly_one_output" in citation_checks


def test_relationships_connect_core_entities() -> None:
    workspace = Workspace(name="Engineering", slug="engineering")
    user = User(email="rudra@example.com", full_name="Rudra", password_hash=None)
    membership = WorkspaceMembership(workspace=workspace, user=user, role=WorkspaceRole.OWNER)
    meeting = Meeting(
        workspace=workspace,
        created_by=user,
        title="Sprint planning",
        source_type=MeetingSourceType.EXTENSION_CAPTURE,
        source_app=MeetingSourceApp.GOOGLE_MEET,
        status=MeetingStatus.RECORDING,
    )
    segment = TranscriptSegment(
        workspace=workspace,
        meeting=meeting,
        speaker_label="Speaker 1",
        start_time=0.0,
        end_time=8.4,
        sequence_number=1,
        text="We should ship the model layer first.",
    )
    action_item = ActionItem(
        workspace=workspace,
        meeting=meeting,
        text="Implement core SQLAlchemy models",
        status=ActionItemStatus.OPEN,
    )
    decision = Decision(
        workspace=workspace,
        meeting=meeting,
        title="Model layer first",
        text="Start backend implementation with core models.",
    )
    action_citation = AIOutputCitation(
        workspace=workspace,
        meeting=meeting,
        transcript_segment=segment,
        action_item=action_item,
        start_time=0.0,
        end_time=8.4,
    )
    decision_citation = AIOutputCitation(
        workspace=workspace,
        meeting=meeting,
        transcript_segment=segment,
        decision=decision,
        start_time=0.0,
        end_time=8.4,
    )

    assert membership in workspace.memberships
    assert membership in user.memberships
    assert meeting in workspace.meetings
    assert meeting in user.created_meetings
    assert segment in meeting.transcript_segments
    assert action_item in meeting.action_items
    assert decision in meeting.decisions
    assert action_citation in segment.citations
    assert action_citation in action_item.citations
    assert decision_citation in segment.citations
    assert decision_citation in decision.citations
