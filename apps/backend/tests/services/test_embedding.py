import uuid

import pytest


@pytest.mark.asyncio
async def test_mock_embedding_embed_texts():
    from app.services.embedding import MockEmbeddingService

    svc = MockEmbeddingService(dimensions=768)
    results = await svc.embed_texts(["hello", "world"])
    assert len(results) == 2
    assert len(results[0]) == 768


@pytest.mark.asyncio
async def test_mock_embedding_embed_query():
    from app.services.embedding import MockEmbeddingService

    svc = MockEmbeddingService(dimensions=768)
    result = await svc.embed_query("hello")
    assert len(result) == 768


def test_chunk_transcript_empty():
    from app.services.embedding import chunk_transcript

    result = chunk_transcript([])
    assert result == []


def test_chunk_transcript_basic():
    from app.services.embedding import chunk_transcript

    segments = [
        {"id": str(uuid.uuid4()), "text": f"Segment {i}", "speaker_label": "SPEAKER_00", "start_time": float(i), "end_time": float(i + 1)}
        for i in range(25)
    ]
    chunks = chunk_transcript(segments, chunk_size=10, overlap=2)
    assert len(chunks) > 0
    assert all("text" in c for c in chunks)
    assert all("content_hash" in c for c in chunks)


def test_embedding_deps_returns_mock():
    from app.services.embedding_deps import get_embedding_service
    from app.services.embedding import MockEmbeddingService
    from app.core.config import Settings

    settings = Settings(jwt_secret="test-secret-32-bytes-long!!!!!!!!")
    svc = get_embedding_service(settings)
    assert isinstance(svc, MockEmbeddingService)
