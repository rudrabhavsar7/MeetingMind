from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_workspace_member
from app.db.session import get_db_session
from app.models.meeting import TranscriptChunk
from app.models.workspace import WorkspaceMembership

router = APIRouter()


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    meeting_ids: list[uuid.UUID] | None = None
    limit: int = Field(default=5, ge=1, le=20)


class CitationResponse(BaseModel):
    meeting_id: str
    chunk_id: str
    text: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    citations: list[CitationResponse]


@router.post("/chat", response_model=ChatResponse)
async def rag_chat(
    workspace_id: uuid.UUID,
    payload: ChatRequest,
    membership: Annotated[WorkspaceMembership, Depends(require_workspace_member)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChatResponse:
    from app.core.config import get_settings
    from app.services.embedding import MockEmbeddingService, OllamaEmbeddingService, OpenAIEmbeddingService

    settings = get_settings()

    if settings.use_mock_ai or settings.embedding_provider == "mock":
        emb_service = MockEmbeddingService(dimensions=settings.embedding_dimensions)
    elif settings.embedding_provider == "ollama":
        emb_service = OllamaEmbeddingService(model=settings.embedding_model, base_url=settings.llm_base_url or "http://localhost:11434", dimensions=settings.embedding_dimensions)
    else:
        api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
        emb_service = OpenAIEmbeddingService(model=settings.embedding_model, api_key=api_key, dimensions=settings.embedding_dimensions)

    query_embedding = await emb_service.embed_query(payload.question)

    stmt = select(TranscriptChunk).where(TranscriptChunk.workspace_id == workspace_id)
    if payload.meeting_ids:
        stmt = stmt.where(TranscriptChunk.meeting_id.in_(payload.meeting_ids))
    stmt = stmt.limit(200)

    result = await db.execute(stmt)
    chunks = list(result.scalars().all())

    scored: list[tuple[TranscriptChunk, float]] = []
    for chunk in chunks:
        if chunk.embedding is not None:
            score = _cosine_similarity(query_embedding, chunk.embedding)
            scored.append((chunk, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    top_chunks = scored[: payload.limit]

    context_parts = []
    citations = []
    for chunk, score in top_chunks:
        context_parts.append(f"[chunk {chunk.id}] {chunk.text}")
        citations.append(
            CitationResponse(
                meeting_id=str(chunk.meeting_id),
                chunk_id=str(chunk.id),
                text=chunk.text[:200],
                score=round(score, 4),
            )
        )

    context = "\n\n".join(context_parts) if context_parts else "No relevant context found."

    if settings.use_mock_ai or settings.llm_provider == "mock":
        answer = f"Based on the meeting transcripts, here is what I found regarding '{payload.question}':\n\n{context[:500]}"
    else:
        answer = await _llm_answer(settings, payload.question, context)

    return ChatResponse(answer=answer, citations=citations)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    import math

    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


async def _llm_answer(settings, question: str, context: str) -> str:
    prompt = (
        f"You are a helpful meeting assistant. Answer the question based on the following meeting transcript context.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        f"Provide a concise, accurate answer with citations to specific transcript chunks."
    )
    try:
        if settings.llm_provider == "ollama":
            import httpx

            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{settings.llm_base_url or 'http://localhost:11434'}/api/chat",
                    json={"model": settings.llm_model, "messages": [{"role": "user", "content": prompt}], "stream": False},
                )
                resp.raise_for_status()
                return resp.json()["message"]["content"]
        elif settings.llm_provider == "openai":
            import httpx

            api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{settings.llm_base_url or 'https://api.openai.com/v1'}/chat/completions",
                    headers=headers,
                    json={"model": settings.llm_model, "messages": [{"role": "user", "content": prompt}]},
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
    except Exception:
        pass
    return f"Based on the meeting transcripts, here is what I found regarding '{question}':\n\n{context[:500]}"
