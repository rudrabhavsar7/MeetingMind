from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.api.dependencies import require_workspace_member
from app.models.workspace import WorkspaceMembership
from app.services.pipeline_events import get_pipeline_broadcaster

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/{meeting_id}/pipeline-events")
async def pipeline_events_ws(
    websocket: WebSocket,
    workspace_id: uuid.UUID,
    meeting_id: uuid.UUID,
) -> None:
    await websocket.accept()

    broadcaster = get_pipeline_broadcaster()
    queue = await broadcaster.subscribe(str(meeting_id))

    try:
        await websocket.send_json({
            "type": "connected",
            "meeting_id": str(meeting_id),
            "message": "Pipeline event stream connected",
        })

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                await websocket.send_json(event)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "heartbeat"})
            except asyncio.CancelledError:
                break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning("Pipeline events WS error: %s", e)
    finally:
        await broadcaster.unsubscribe(str(meeting_id), queue)
