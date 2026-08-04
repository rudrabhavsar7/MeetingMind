from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_workspace_member
from app.core.config import Settings, get_settings
from app.db.session import get_db_session
from app.models.enums import MeetingSourceType, MeetingStatus
from app.models.workspace import WorkspaceMembership
from app.schemas.meeting import (
    ImportCompleteEnvelope,
    ImportCompleteRequest,
    ImportCompleteResponse,
    LiveMeetingCreate,
    LiveMeetingEnvelope,
    LiveMeetingResponse,
    MeetingResponse,
    PresignedUrlEnvelope,
    PresignedUrlRequest,
    PresignedUrlResponse,
)
from app.services.meeting import MeetingService, SqlAlchemyMeetingRepository
from app.services.storage import StorageService

router = APIRouter()


async def get_meeting_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeetingService:
    return MeetingService(SqlAlchemyMeetingRepository(session))


async def get_storage_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageService:
    return StorageService(settings)


@router.post("/import/presigned-url", response_model=PresignedUrlEnvelope, status_code=status.HTTP_201_CREATED)
async def generate_presigned_url(
    workspace_id: uuid.UUID,
    payload: PresignedUrlRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
    storage_service: Annotated[StorageService, Depends(get_storage_service)],
) -> PresignedUrlEnvelope:
    allowed_mime_types = ["audio/mpeg", "audio/wav", "audio/x-m4a", "video/mp4", "video/webm", "audio/webm"]
    if payload.mime_type not in allowed_mime_types:
        raise HTTPException(status_code=422, detail="Unsupported MIME type")

    meeting = await meeting_service.create_meeting(
        workspace_id=workspace_id,
        title=payload.title,
        source_type=MeetingSourceType.STANDALONE_WEB_CAPTURE, # Use generic for imports or add IMPORT enum
        source_app="file_import",
        status=MeetingStatus.RECORDING,
    )

    object_key = f"workspaces/{workspace_id}/meetings/{meeting.id}/imports/{payload.filename}"
    
    upload_url = await storage_service.generate_presigned_put_url(
        object_key=object_key,
        mime_type=payload.mime_type,
        expires_in_seconds=900,
    )

    return PresignedUrlEnvelope(
        data=PresignedUrlResponse(
            meeting_id=meeting.id,
            upload_url=upload_url,
            object_key=object_key,
            expires_at=datetime.now(UTC) + timedelta(seconds=900),
            required_headers={"Content-Type": payload.mime_type},
        )
    )


@router.post("/import-complete", response_model=ImportCompleteEnvelope, status_code=status.HTTP_202_ACCEPTED)
async def import_complete(
    workspace_id: uuid.UUID,
    payload: ImportCompleteRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
    storage_service: Annotated[StorageService, Depends(get_storage_service)],
) -> ImportCompleteEnvelope:
    meeting = await meeting_service.get_meeting(payload.meeting_id)
    if not meeting or meeting.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    exists = await storage_service.object_exists(payload.object_key)
    if not exists:
        raise HTTPException(status_code=400, detail="Uploaded file not found in storage")

    await meeting_service.update_status(payload.meeting_id, MeetingStatus.TRANSCRIBING)

    # In a real implementation, we would queue a celery task here.
    queued_task_id = "celery-task-id-mock"

    return ImportCompleteEnvelope(
        data=ImportCompleteResponse(
            meeting_id=meeting.id,
            status=MeetingStatus.TRANSCRIBING.value,
            queued_task_id=queued_task_id,
        )
    )

@router.post("/live", response_model=LiveMeetingEnvelope, status_code=status.HTTP_201_CREATED)
async def create_live_meeting(
    workspace_id: uuid.UUID,
    payload: LiveMeetingCreate,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
) -> LiveMeetingEnvelope:
    try:
        source_type = MeetingSourceType(payload.source_type)
    except ValueError:
        raise HTTPException(status_code=422, detail="Unsupported source type")

    meeting = await meeting_service.create_meeting(
        workspace_id=workspace_id,
        title=payload.source_title or "Live Meeting",
        source_type=source_type,
        source_app=payload.source_app,
        started_at=payload.started_at,
        status=MeetingStatus.RECORDING,
    )

    stream_token = "mock-stream-token-" + str(meeting.id)
    expires_at = datetime.now(UTC) + timedelta(minutes=15)

    return LiveMeetingEnvelope(
        data=LiveMeetingResponse(
            meeting=MeetingResponse(
                id=meeting.id,
                workspace_id=meeting.workspace_id,
                title=meeting.title,
                status=meeting.status.value,
                source_type=meeting.source_type.value,
                source_app=meeting.source_app,
                started_at=meeting.started_at,
            ),
            stream_url=f"wss://host/api/v1/workspaces/{workspace_id}/meetings/{meeting.id}/stream",
            stream_token=stream_token,
            stream_token_expires_at=expires_at,
        )
    )
