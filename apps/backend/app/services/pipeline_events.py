from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class PipelineEventBroadcaster:
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self._pubsub = None
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            import redis.asyncio as aioredis
            self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def publish(self, meeting_id: str, event: dict[str, Any]) -> None:
        redis = await self._get_redis()
        channel = f"pipeline:{meeting_id}"
        event["meeting_id"] = meeting_id
        await redis.publish(channel, json.dumps(event, default=str))

    async def subscribe(self, meeting_id: str):
        redis = await self._get_redis()
        pubsub = redis.pubsub()
        channel = f"pipeline:{meeting_id}"
        await pubsub.subscribe(channel)
        return pubsub

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()
            self._redis = None


class InMemoryPipelineBroadcaster:
    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    async def publish(self, meeting_id: str, event: dict[str, Any]) -> None:
        event["meeting_id"] = meeting_id
        for queue in self._subscribers.get(meeting_id, []):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                pass

    async def subscribe(self, meeting_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.setdefault(meeting_id, []).append(queue)
        return queue

    async def unsubscribe(self, meeting_id: str, queue: asyncio.Queue) -> None:
        if meeting_id in self._subscribers:
            self._subscribers[meeting_id] = [q for q in self._subscribers[meeting_id] if q is not queue]


_broadcaster: InMemoryPipelineBroadcaster | None = None


def get_pipeline_broadcaster() -> InMemoryPipelineBroadcaster:
    global _broadcaster
    if _broadcaster is None:
        _broadcaster = InMemoryPipelineBroadcaster()
    return _broadcaster
