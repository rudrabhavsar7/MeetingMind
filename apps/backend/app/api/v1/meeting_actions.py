from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_workspace_member, require_workspace_role
from app.db.session import get_db_session
from app.models.ai import AIOutputFeedback
from app.models.enums import ActionItemStatus, WorkspaceRole
from app.models.meeting import ActionItem, Decision
from app.models.workspace import WorkspaceMembership
from app.schemas.meeting_actions import (
    ActionItemListEnvelope,
    ActionItemResponse,
    ActionItemUpdateRequest,
    AIFeedbackRequest,
    AIFeedbackResponse,
    CitationResponse,
    DecisionListEnvelope,
    DecisionResponse,
    SummaryRegenerateEnvelope,
    SummaryRegenerateRequest,
    SummaryRegenerateResponse,
    SummaryVersionListEnvelope,
    SummaryVersionResponse,
)
from app.services.meeting import MeetingService, SqlAlchemyMeetingRepository
from app.services.meeting_actions import MeetingActionService, SqlAlchemyMeetingActionRepository

router = APIRouter()


async def get_meeting_action_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeetingActionService:
    return MeetingActionService(SqlAlchemyMeetingActionRepository(session))


async def get_meeting_svc(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeetingService:
    return MeetingService(SqlAlchemyMeetingRepository(session))


def _action_item_to_response(item: ActionItem) -> ActionItemResponse:
    citations = [
        CitationResponse(segment_id=c.transcript_segment_id, start_time=c.start_time, end_time=c.end_time)
        for c in getattr(item, "citations", [])
    ]
    return ActionItemResponse(
        id=item.id,
        workspace_id=item.workspace_id,
        meeting_id=item.meeting_id,
        ai_processing_run_id=item.ai_processing_run_id,
        text=item.text,
        assignee_name=item.assignee_name,
        due_date=item.due_date,
        status=item.status.value if item.status else "open",
        origin=item.origin.value if item.origin else "ai",
        confidence_score=item.confidence_score,
        citations=citations,
    )


def _decision_to_response(d: Decision) -> DecisionResponse:
    citations = [
        CitationResponse(segment_id=c.transcript_segment_id, start_time=c.start_time, end_time=c.end_time)
        for c in getattr(d, "citations", [])
    ]
    return DecisionResponse(
        id=d.id,
        workspace_id=d.workspace_id,
        meeting_id=d.meeting_id,
        ai_processing_run_id=d.ai_processing_run_id,
        title=d.title,
        text=d.text,
        rationale=d.rationale,
        origin=d.origin.value if d.origin else "ai",
        confidence_score=d.confidence_score,
        citations=citations,
    )


@router.get("/{meeting_id}/action-items", response_model=ActionItemListEnvelope)
async def list_action_items(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    action_service: Annotated[MeetingActionService, Depends(get_meeting_action_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_svc)],
    status_filter: str | None = Query(default=None, alias="filter[status]"),
) -> ActionItemListEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    parsed_status = ActionItemStatus(status_filter) if status_filter else None
    items = await action_service.list_action_items(meeting_id, status=parsed_status)
    return ActionItemListEnvelope(data=[_action_item_to_response(i) for i in items])


@router.patch("/{meeting_id}/action-items/{item_id}", response_model=ActionItemResponse)
async def update_action_item(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: ActionItemUpdateRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.MEMBER))],
    action_service: Annotated[MeetingActionService, Depends(get_meeting_action_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_svc)],
) -> ActionItemResponse:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] is not None:
        update_data["status"] = ActionItemStatus(update_data["status"])

    item = await action_service.update_action_item(item_id, meeting_id, **update_data)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    return _action_item_to_response(item)


@router.get("/{meeting_id}/decisions", response_model=DecisionListEnvelope)
async def list_decisions(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    action_service: Annotated[MeetingActionService, Depends(get_meeting_action_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_svc)],
) -> DecisionListEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    decisions = await action_service.list_decisions(meeting_id)
    return DecisionListEnvelope(data=[_decision_to_response(d) for d in decisions])


@router.get("/{meeting_id}/summaries", response_model=SummaryVersionListEnvelope)
async def list_summary_versions(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    action_service: Annotated[MeetingActionService, Depends(get_meeting_action_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_svc)],
) -> SummaryVersionListEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    versions = await action_service.list_summary_versions(meeting_id)
    return SummaryVersionListEnvelope(
        data=[
            SummaryVersionResponse(
                id=v.id,
                workspace_id=v.workspace_id,
                meeting_id=v.meeting_id,
                ai_processing_run_id=v.ai_processing_run_id,
                version=v.version,
                kind=v.kind,
                executive_summary=v.executive_summary,
                key_points=v.key_points or [],
                status=v.status,
                citations=[
                    CitationResponse(segment_id=c.transcript_segment_id, start_time=c.start_time, end_time=c.end_time)
                    for c in getattr(v, "citations", [])
                ],
                created_at=v.created_at,
            )
            for v in versions
        ]
    )


@router.post(
    "/{meeting_id}/summaries/regenerate",
    response_model=SummaryRegenerateEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
)
async def regenerate_summary(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    payload: SummaryRegenerateRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_role(WorkspaceRole.MEMBER))],
    action_service: Annotated[MeetingActionService, Depends(get_meeting_action_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_svc)],
) -> SummaryRegenerateEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    from app.tasks.summarization import generate_summary

    task_result = generate_summary.delay(str(meeting_id), str(workspace_id))
    return SummaryRegenerateEnvelope(data=SummaryRegenerateResponse(meeting_id=meeting_id, status="queued", queued_task_id=task_result.id))


@router.post("/{meeting_id}/ai-feedback", response_model=AIFeedbackResponse)
async def create_ai_feedback(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    payload: AIFeedbackRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    action_service: Annotated[MeetingActionService, Depends(get_meeting_action_service)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_svc)],
) -> AIFeedbackResponse:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    feedback_kwargs: dict[str, object] = {
        "workspace_id": workspace_id,
        "meeting_id": meeting_id,
        "user_id": membership.user_id,
        "rating": payload.rating,
        "comment": payload.comment,
    }
    if payload.output_type == "summary_version":
        feedback_kwargs["summary_version_id"] = payload.output_id
    elif payload.output_type == "action_item":
        feedback_kwargs["action_item_id"] = payload.output_id
    elif payload.output_type == "decision":
        feedback_kwargs["decision_id"] = payload.output_id

    feedback = AIOutputFeedback(**feedback_kwargs)
    created = await action_service.create_feedback(feedback)
    return AIFeedbackResponse(id=created.id, output_type=payload.output_type, output_id=payload.output_id, rating=created.rating)
