from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
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
    StreamTokenRefreshEnvelope,
    StreamTokenRefreshRequest,
    StreamTokenRefreshResponse,
)
from app.services.meeting import MeetingService, SqlAlchemyMeetingRepository
from app.services.storage import StorageService
from app.api.v1.meeting_actions import router as meeting_actions_router

router = APIRouter()
router.include_router(meeting_actions_router)

from app.api.v1.transcript import router as transcript_router
router.include_router(transcript_router)


async def get_meeting_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeetingService:
    return MeetingService(SqlAlchemyMeetingRepository(session))


async def get_storage_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageService:
    return StorageService(settings)


@router.post(
    "/import/presigned-url",
    response_model=PresignedUrlEnvelope,
    status_code=status.HTTP_201_CREATED,
)
async def generate_presigned_url(
    workspace_id: uuid.UUID,
    payload: PresignedUrlRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
    storage_service: Annotated[StorageService, Depends(get_storage_service)],
) -> PresignedUrlEnvelope:
    allowed_mime_types = [
        "audio/mpeg",
        "audio/wav",
        "audio/x-m4a",
        "video/mp4",
        "video/webm",
        "audio/webm",
    ]
    if payload.mime_type not in allowed_mime_types:
        raise HTTPException(status_code=422, detail="Unsupported MIME type")

    meeting = await meeting_service.create_meeting(
        workspace_id=workspace_id,
        title=payload.title,
        source_type=MeetingSourceType.STANDALONE_WEB_CAPTURE,  # Use generic for imports or add IMPORT enum
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
    except ValueError as err:
        raise HTTPException(status_code=422, detail="Unsupported source type") from err

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


@router.post("/{meeting_id}/stream-token", response_model=StreamTokenRefreshEnvelope)
async def refresh_stream_token(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    payload: StreamTokenRefreshRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
) -> StreamTokenRefreshEnvelope:
    meeting = await meeting_service.get_meeting(meeting_id)
    if not meeting or meeting.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.status not in (MeetingStatus.RECORDING, MeetingStatus.PAUSED):
        raise HTTPException(status_code=400, detail="Meeting is not in an active recording state")

    # In reality, this token should be stored in Redis/DB with expiry
    stream_token = f"mock-stream-token-{meeting_id}-refreshed"
    expires_at = datetime.now(UTC) + timedelta(minutes=15)

    return StreamTokenRefreshEnvelope(
        data=StreamTokenRefreshResponse(
            stream_url=f"wss://host/api/v1/workspaces/{workspace_id}/meetings/{meeting_id}/stream",
            stream_token=stream_token,
            expires_at=expires_at,
        )
    )


@router.websocket("/{meeting_id}/stream")
async def meeting_stream(
    websocket: WebSocket,
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
) -> None:
    await websocket.accept()
    highest_sequence = -1
    seen_sequences = set()

    try:
        # Handshake
        data = await websocket.receive_json()
        if data.get("type") == "stream_hello":
            await websocket.send_json(
                {
                    "type": "stream_ready",
                    "protocol_version": "1.0",
                    "meeting_id": str(meeting_id),
                    "highest_contiguous_sequence": highest_sequence,
                    "heartbeat_interval_ms": 15000,
                    "max_chunk_bytes": 16020,
                    "max_session_duration_ms": 28800000,
                }
            )

        while True:
            message = await websocket.receive()
            if "bytes" in message:
                payload = message["bytes"]
                if len(payload) >= 20 and payload[0:4] == b"MM01":
                    import struct

                    sequence = struct.unpack(">I", payload[4:8])[0]
                    # Start offset ms: unpack(">Q", payload[8:16])[0]
                    # Duration ms: unpack(">H", payload[16:18])[0]
                    # Flags: unpack(">H", payload[18:20])[0]

                    if sequence not in seen_sequences:
                        seen_sequences.add(sequence)
                        # Normalize logic or pass to Celery/streaming STT queue would go here

                        if sequence == highest_sequence + 1:
                            highest_sequence = sequence
                            # Optionally advance highest_sequence if next ones are already in seen_sequences
                            while highest_sequence + 1 in seen_sequences:
                                highest_sequence += 1

                    await websocket.send_json(
                        {
                            "type": "audio_ack",
                            "highest_contiguous_sequence": highest_sequence,
                            "received_at": datetime.now(UTC).isoformat(),
                        }
                    )
            elif "text" in message:
                import json

                try:
                    data = json.loads(message["text"])
                    if data.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
