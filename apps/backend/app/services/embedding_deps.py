from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.services.embedding import MockEmbeddingService, OllamaEmbeddingService, OpenAIEmbeddingService


def get_embedding_service(settings: Annotated[Settings, Depends(get_settings)]):
    if settings.use_mock_ai or settings.embedding_provider == "mock":
        return MockEmbeddingService(dimensions=settings.embedding_dimensions)
    base_url = settings.llm_base_url or "http://localhost:11434"
    if settings.embedding_provider == "ollama":
        return OllamaEmbeddingService(model=settings.embedding_model, base_url=base_url, dimensions=settings.embedding_dimensions)
    api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
    return OpenAIEmbeddingService(model=settings.embedding_model, api_key=api_key, base_url=base_url, dimensions=settings.embedding_dimensions)
