import asyncio
import uuid

import pytest


@pytest.mark.asyncio
async def test_in_memory_broadcaster_publish_subscribe():
    from app.services.pipeline_events import InMemoryPipelineBroadcaster

    broadcaster = InMemoryPipelineBroadcaster()
    queue = await broadcaster.subscribe("test-meeting-1")

    await broadcaster.publish("test-meeting-1", {"type": "transcription_started"})

    event = await asyncio.wait_for(queue.get(), timeout=1.0)
    assert event["type"] == "transcription_started"
    assert event["meeting_id"] == "test-meeting-1"

    await broadcaster.unsubscribe("test-meeting-1", queue)


@pytest.mark.asyncio
async def test_in_memory_broadcaster_multiple_subscribers():
    from app.services.pipeline_events import InMemoryPipelineBroadcaster

    broadcaster = InMemoryPipelineBroadcaster()
    q1 = await broadcaster.subscribe("test-meeting-2")
    q2 = await broadcaster.subscribe("test-meeting-2")

    await broadcaster.publish("test-meeting-2", {"type": "summary_generated"})

    e1 = await asyncio.wait_for(q1.get(), timeout=1.0)
    e2 = await asyncio.wait_for(q2.get(), timeout=1.0)
    assert e1["type"] == "summary_generated"
    assert e2["type"] == "summary_generated"


def test_pipeline_events_module_importable():
    from app.api.v1.pipeline_events import router
    assert hasattr(router, "websocket")


def test_pipeline_broadcaster_singleton():
    from app.services.pipeline_events import get_pipeline_broadcaster, InMemoryPipelineBroadcaster
    b1 = get_pipeline_broadcaster()
    b2 = get_pipeline_broadcaster()
    assert b1 is b2
    assert isinstance(b1, InMemoryPipelineBroadcaster)
