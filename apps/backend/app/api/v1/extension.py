import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.schemas.extension import (
    AudioChunkMs,
    ExtensionCapabilitiesEnvelope,
    ExtensionCapabilitiesResponse,
    ExtensionConnectEnvelope,
    ExtensionConnectRequest,
    ExtensionConnectResponse,
    ExtensionHeartbeatEnvelope,
    ExtensionHeartbeatRequest,
    ExtensionHeartbeatResponse,
    WorkspaceSummary,
)

router = APIRouter()


@router.post("/connect", response_model=ExtensionConnectEnvelope)
async def connect_extension(
    payload: ExtensionConnectRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExtensionConnectEnvelope:
    # Verify user is a member of the workspace
    membership = await session.get(WorkspaceMembership, (current_user.id, payload.workspace_id))
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the workspace")

    workspace = await session.get(Workspace, payload.workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # Note: In a real app, you would persist this token in Redis or DB.
    # For now, we mock the token logic.
    extension_token = f"ext-mock-{uuid.uuid4()}"
    expires_at = datetime.now(UTC) + timedelta(hours=8)

    return ExtensionConnectEnvelope(
        data=ExtensionConnectResponse(
            extension_token=extension_token,
            expires_at=expires_at,
            workspace=WorkspaceSummary(
                id=workspace.id,
                name=workspace.name,
                slug=workspace.slug,
                role=membership.role.value,
            ),
            event_schema_version="1.0",
        )
    )


@router.get("/capabilities", response_model=ExtensionCapabilitiesEnvelope)
async def get_capabilities(
    workspace_id: uuid.UUID,
    # Ideally depends on extension token or bearer token
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExtensionCapabilitiesEnvelope:
    # Verify user is a member of the workspace
    membership = await session.get(WorkspaceMembership, (current_user.id, workspace_id))
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the workspace")

    workspace = await session.get(Workspace, workspace_id)

    return ExtensionCapabilitiesEnvelope(
        data=ExtensionCapabilitiesResponse(
            supported_apps=["google_meet"],
            fast_follow_apps=["zoom_web", "teams_web"],
            audio_chunk_ms=AudioChunkMs(min=250, max=500, recommended=500),
            raw_audio_retention_days=workspace.raw_audio_retention_days if workspace else None,
            standalone_web_capture_enabled=True,
            recording_import_enabled=True,
            event_schema_version="1.0",
        )
    )


@router.post("/heartbeat", response_model=ExtensionHeartbeatEnvelope)
async def extension_heartbeat(
    payload: ExtensionHeartbeatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ExtensionHeartbeatEnvelope:
    # Requires valid extension token in reality, checking bearer token for now
    return ExtensionHeartbeatEnvelope(data=ExtensionHeartbeatResponse(status="ok", server_time=datetime.now(UTC)))
