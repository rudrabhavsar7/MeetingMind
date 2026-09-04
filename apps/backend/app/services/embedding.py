from __future__ import annotations

import hashlib
import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class EmbeddingService(Protocol):
    async def embed_texts(self, texts: list[str]) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]: ...


class OllamaEmbeddingService:
    def __init__(self, model: str = "nomic-embed-text", base_url: str = "http://localhost:11434", dimensions: int = 768):
        self.model = model
        self.base_url = base_url
        self.dimensions = dimensions

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        import httpx

        results = []
        async with httpx.AsyncClient(timeout=60) as client:
            for text in texts:
                resp = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": self.model, "prompt": text},
                )
                resp.raise_for_status()
                embedding = resp.json()["embedding"]
                results.append(embedding[: self.dimensions])
        return results

    async def embed_query(self, text: str) -> list[float]:
        results = await self.embed_texts([text])
        return results[0]


class OpenAIEmbeddingService:
    def __init__(
        self,
        model: str = "text-embedding-3-small",
        api_key: str | None = None,
        base_url: str = "https://api.openai.com/v1",
        dimensions: int = 768,
    ):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self.dimensions = dimensions

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        import httpx

        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.base_url}/embeddings",
                headers=headers,
                json={"model": self.model, "input": texts, "dimensions": self.dimensions},
            )
            resp.raise_for_status()
            data = resp.json()["data"]
            return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]

    async def embed_query(self, text: str) -> list[float]:
        results = await self.embed_texts([text])
        return results[0]


class MockEmbeddingService:
    def __init__(self, dimensions: int = 768):
        self.dimensions = dimensions

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        import random

        random.seed(42)
        return [[random.random() for _ in range(self.dimensions)] for _ in texts]

    async def embed_query(self, text: str) -> list[float]:
        results = await self.embed_texts([text])
        return results[0]


def chunk_transcript(
    segments: list[dict[str, Any]],
    chunk_size: int = 10,
    overlap: int = 2,
    chunker_version: str = "v1",
) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    if not segments:
        return chunks

    for i in range(0, len(segments), chunk_size - overlap):
        batch = segments[i : i + chunk_size]
        if not batch:
            break
        text = "\n".join(f"[{s.get('speaker_label', 'SPEAKER_00')}] {s.get('text', '')}" for s in batch)
        content_hash = hashlib.sha256(text.encode()).hexdigest()
        chunks.append(
            {
                "text": text,
                "start_time": batch[0].get("start_time", 0.0),
                "end_time": batch[-1].get("end_time", 0.0),
                "first_segment_id": batch[0].get("id"),
                "last_segment_id": batch[-1].get("id"),
                "content_hash": content_hash,
                "chunker_version": chunker_version,
            }
        )
        if i + chunk_size >= len(segments):
            break
    return chunks
