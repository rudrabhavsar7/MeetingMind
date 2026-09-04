from __future__ import annotations

import logging
import uuid

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.embedding.build_embeddings", max_retries=3)
def build_embeddings(self, meeting_id: str, workspace_id: str) -> dict[str, object]:
    import asyncio

    from sqlalchemy import select

    from app.core.config import get_settings
    from app.db.session import AsyncSessionLocal
    from app.models.meeting import Meeting, TranscriptChunk, TranscriptSegment
    from app.services.embedding import MockEmbeddingService, OllamaEmbeddingService, OpenAIEmbeddingService, chunk_transcript

    settings = get_settings()
    mid = uuid.UUID(meeting_id)
    wid = uuid.UUID(workspace_id)

    async def _run():
        async with AsyncSessionLocal() as session:
            meeting = await session.get(Meeting, mid)
            if not meeting:
                return {"status": "error", "detail": "meeting_not_found"}

            seg_stmt = select(TranscriptSegment).where(TranscriptSegment.meeting_id == mid).order_by(TranscriptSegment.start_time)
            result = await session.execute(seg_stmt)
            segments = list(result.scalars().all())

            if not segments:
                return {"status": "completed", "meeting_id": meeting_id, "chunks_created": 0}

            seg_dicts = [
                {
                    "id": str(s.id),
                    "text": s.text,
                    "speaker_label": s.speaker_label,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                }
                for s in segments
            ]
            chunked = chunk_transcript(seg_dicts, chunk_size=10, overlap=2)

            emb_service: MockEmbeddingService | OllamaEmbeddingService | OpenAIEmbeddingService
            if settings.use_mock_ai or settings.embedding_provider == "mock":
                emb_service = MockEmbeddingService(dimensions=settings.embedding_dimensions)
            elif settings.embedding_provider == "ollama":
                emb_service = OllamaEmbeddingService(
                    model=settings.embedding_model,
                    base_url=settings.llm_base_url or "http://localhost:11434",
                    dimensions=settings.embedding_dimensions,
                )
            else:
                api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
                emb_service = OpenAIEmbeddingService(
                    model=settings.embedding_model, api_key=api_key, dimensions=settings.embedding_dimensions
                )

            texts = [c["text"] for c in chunked]
            embeddings = await emb_service.embed_texts(texts)

            for chunk_data, embedding in zip(chunked, embeddings, strict=False):
                tc = TranscriptChunk(
                    workspace_id=wid,
                    meeting_id=mid,
                    first_segment_id=uuid.UUID(chunk_data["first_segment_id"]) if chunk_data["first_segment_id"] else uuid.uuid4(),
                    last_segment_id=uuid.UUID(chunk_data["last_segment_id"]) if chunk_data["last_segment_id"] else uuid.uuid4(),
                    text=chunk_data["text"],
                    start_time=chunk_data["start_time"],
                    end_time=chunk_data["end_time"],
                    content_hash=chunk_data["content_hash"],
                    chunker_version=chunk_data["chunker_version"],
                    embedding_model=settings.embedding_model,
                    embedding_dimensions=settings.embedding_dimensions,
                    embedding=embedding,
                )
                session.add(tc)

            await session.commit()
            return {
                "status": "completed",
                "meeting_id": meeting_id,
                "chunks_created": len(chunked),
            }

    return asyncio.get_event_loop().run_until_complete(_run())
