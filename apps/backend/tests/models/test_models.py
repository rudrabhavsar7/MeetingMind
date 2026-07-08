from __future__ import annotations

import uuid
from typing import Protocol, cast

from sqlalchemy import Table
from sqlalchemy.schema import ColumnDefault

import app.models  # noqa: F401
from app.db.base import Base
from app.models import (
    ActionItem,
    ActionItemStatus,
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


def _generated_primary_key(model: type[Base]) -> uuid.UUID:
    default = _table(model).c.id.default
    assert isinstance(default, ColumnDefault)
    assert callable(default.arg)
    default_factory = cast("CallableWithSqlAlchemyContext", default.arg)
    return default_factory(None)


def test_models_are_registered_with_metadata() -> None:
    assert {
        "users",
        "workspaces",
        "workspace_memberships",
        "refresh_tokens",
        "meetings",
        "transcript_segments",
        "action_items",
        "decisions",
    }.issubset(Base.metadata.tables)


def test_public_models_use_uuid_primary_key_defaults() -> None:
    models = [
        User,
        Workspace,
        WorkspaceMembership,
        Meeting,
        TranscriptSegment,
        ActionItem,
        Decision,
    ]

    for model in models:
        assert isinstance(_generated_primary_key(model), uuid.UUID)


def test_tenant_scoped_models_include_workspace_foreign_key() -> None:
    for model in [Meeting, TranscriptSegment, ActionItem, Decision]:
        workspace_id = _table(model).c.workspace_id

        assert workspace_id.foreign_keys
        assert any(
            foreign_key.target_fullname == "workspaces.id"
            for foreign_key in workspace_id.foreign_keys
        )


def test_core_indexes_exist_for_common_queries() -> None:
    meeting_indexes = {index.name for index in _table(Meeting).indexes}
    transcript_indexes = {index.name for index in _table(TranscriptSegment).indexes}
    action_item_indexes = {index.name for index in _table(ActionItem).indexes}

    assert "ix_meetings_workspace_started_at" in meeting_indexes
    assert "ix_meetings_workspace_status" in meeting_indexes
    assert "ix_transcript_segments_meeting_start_time" in transcript_indexes
    assert "ix_action_items_status" in action_item_indexes


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
        source_segment=segment,
        text="Implement core SQLAlchemy models",
        status=ActionItemStatus.OPEN,
    )
    decision = Decision(
        workspace=workspace,
        meeting=meeting,
        source_segment=segment,
        title="Model layer first",
        text="Start backend implementation with core models.",
    )

    assert membership in workspace.memberships
    assert membership in user.memberships
    assert meeting in workspace.meetings
    assert meeting in user.created_meetings
    assert segment in meeting.transcript_segments
    assert action_item in meeting.action_items
    assert decision in meeting.decisions
    assert action_item in segment.action_items
    assert decision in segment.decisions
