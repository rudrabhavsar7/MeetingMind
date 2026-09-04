import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.security import generate_opaque_token, hash_opaque_token
from app.db.session import get_db_session
from app.models.auth import ExtensionSession
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
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExtensionConnectEnvelope:
    membership = await session.get(WorkspaceMembership, (current_user.id, payload.workspace_id))
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of the workspace")

    workspace = await session.get(Workspace, payload.workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    extension_token = generate_opaque_token()
    token_hash = hash_opaque_token(extension_token)
    expires_at = datetime.now(UTC) + timedelta(hours=8)
    device_id = str(uuid.uuid4())
    browser = payload.browser or request.headers.get("user-agent", "unknown")

    ext_session = ExtensionSession(
        workspace_id=payload.workspace_id,
        user_id=current_user.id,
        device_id=device_id,
        token_hash=token_hash,
        extension_version=payload.extension_version,
        browser=browser,
        expires_at=expires_at,
    )
    session.add(ext_session)
    await session.commit()

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
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExtensionCapabilitiesEnvelope:
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
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExtensionHeartbeatEnvelope:
    now = datetime.now(UTC)
    stmt = (
        select(ExtensionSession)
        .where(
            ExtensionSession.user_id == current_user.id,
            ExtensionSession.workspace_id == payload.workspace_id,
            ExtensionSession.revoked_at.is_(None),
            ExtensionSession.expires_at > now,
        )
        .order_by(ExtensionSession.last_heartbeat_at.desc().nulls_last())
        .limit(1)
    )
    result = await session.execute(stmt)
    ext_session = result.scalar_one_or_none()

    if ext_session:
        ext_session.last_heartbeat_at = now
        await session.commit()

    return ExtensionHeartbeatEnvelope(data=ExtensionHeartbeatResponse(status="ok", server_time=now))
