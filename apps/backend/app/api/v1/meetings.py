from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.responses import PlainTextResponse
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
    MeetingDetailEnvelope,
    MeetingDetailResponse,
    MeetingListEnvelope,
    MeetingListItem,
    MeetingListMeta,
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
from app.api.v1.transcript import router as transcript_router

router = APIRouter()
router.include_router(transcript_router)


async def get_meeting_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> MeetingService:
    return MeetingService(SqlAlchemyMeetingRepository(session))


async def get_storage_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageService:
    return StorageService(settings)


@router.get("", response_model=MeetingListEnvelope)
async def list_meetings(
    workspace_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
    status_filter: str | None = None,
    source_type_filter: str | None = None,
    cursor: str | None = None,
    limit: int = 50,
) -> MeetingListEnvelope:
    if limit < 1 or limit > 100:
        limit = 50

    parsed_status = MeetingStatus(status_filter) if status_filter else None
    parsed_source = MeetingSourceType(source_type_filter) if source_type_filter else None

    from datetime import datetime as dt

    parsed_cursor = dt.fromisoformat(cursor) if cursor else None

    meetings, next_cursor = await meeting_service.list_meetings(
        workspace_id, status=parsed_status, source_type=parsed_source, cursor=parsed_cursor, limit=limit
    )

    items = []
    for m in meetings:
        participant_count = await meeting_service.get_participant_count(m.id)
        summary_preview = await meeting_service.get_summary_preview(m.id)
        items.append(
            MeetingListItem(
                id=m.id,
                workspace_id=m.workspace_id,
                title=m.title,
                status=m.status.value if m.status else "scheduled",
                source_type=m.source_type.value if m.source_type else "unknown",
                source_app=m.source_app.value if m.source_app else None,
                started_at=m.started_at,
                ended_at=m.ended_at,
                duration_seconds=m.duration_seconds,
                participant_count=participant_count,
                summary_preview=summary_preview,
            )
        )

    return MeetingListEnvelope(
        data=items,
        meta=MeetingListMeta(next_cursor=next_cursor, has_more=next_cursor is not None, limit=limit),
    )


@router.get("/{meeting_id}", response_model=MeetingDetailEnvelope)
async def get_meeting_detail(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
) -> MeetingDetailEnvelope:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participant_count = await meeting_service.get_participant_count(meeting.id)

    return MeetingDetailEnvelope(
        data=MeetingDetailResponse(
            id=meeting.id,
            workspace_id=meeting.workspace_id,
            title=meeting.title,
            status=meeting.status.value if meeting.status else "scheduled",
            source_type=meeting.source_type.value if meeting.source_type else "unknown",
            source_app=meeting.source_app.value if meeting.source_app else None,
            source_url=meeting.source_url,
            source_title=meeting.source_title,
            started_at=meeting.started_at,
            ended_at=meeting.ended_at,
            duration_seconds=meeting.duration_seconds,
            raw_audio_retained=meeting.raw_audio_retained,
            created_by_user_id=meeting.created_by_user_id,
            participant_count=participant_count,
        )
    )


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_meeting(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
) -> None:
    deleted = await meeting_service.soft_delete_meeting(meeting_id, workspace_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Meeting not found")


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


@router.get("/{meeting_id}/media-url")
async def get_media_url(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
    storage_service: Annotated[StorageService, Depends(get_storage_service)],
) -> dict[str, object]:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.raw_audio_retained:
        raise HTTPException(status_code=404, detail="No retained media for this meeting")

    object_key = f"workspaces/{workspace_id}/meetings/{meeting_id}/media"
    try:
        upload_url = await storage_service.generate_presigned_put_url(
            object_key=object_key, mime_type="video/mp4", expires_in_seconds=900
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Media URL generation failed")

    return {"data": {"meeting_id": str(meeting_id), "media_url": upload_url, "expires_at": (datetime.now(UTC) + timedelta(minutes=15)).isoformat(), "content_type": "video/mp4"}}


@router.get("/{meeting_id}/exports/markdown")
async def export_meeting_markdown(
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    meeting_service: Annotated[MeetingService, Depends(get_meeting_service)],
) -> PlainTextResponse:
    meeting = await meeting_service.get_meeting_detail(meeting_id, workspace_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    from fastapi.responses import PlainTextResponse

    title = meeting.title or "Untitled Meeting"
    status_val = meeting.status.value if meeting.status else "unknown"
    started = meeting.started_at.isoformat() if meeting.started_at else "N/A"
    ended = meeting.ended_at.isoformat() if meeting.ended_at else "In progress"
    duration = f"{meeting.duration_seconds}s" if meeting.duration_seconds else "N/A"

    md_lines = [
        f"# {title}",
        "",
        f"- **Status:** {status_val}",
        f"- **Started:** {started}",
        f"- **Ended:** {ended}",
        f"- **Duration:** {duration}",
        "",
        "## Action Items",
        "",
        "_No action items yet._",
        "",
        "## Decisions",
        "",
        "_No decisions recorded._",
        "",
        "## Transcript",
        "",
        "_No transcript segments available._",
        "",
    ]
    md_content = "\n".join(md_lines)
    safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip() or "meeting"
    return PlainTextResponse(
        content=md_content,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.md"'},
    )
