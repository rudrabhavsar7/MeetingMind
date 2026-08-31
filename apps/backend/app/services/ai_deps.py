from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.services.ai import MockLLMService, OllamaLLMService, OpenAILLMService


def get_llm_service(settings: Annotated[Settings, Depends(get_settings)]):
    if settings.use_mock_ai or settings.llm_provider == "mock":
        return MockLLMService()
    base_url = settings.llm_base_url or "http://localhost:11434"
    if settings.llm_provider == "ollama":
        return OllamaLLMService(model=settings.llm_model, base_url=base_url)
    api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
    return OpenAILLMService(model=settings.llm_model, api_key=api_key, base_url=base_url or "https://api.openai.com/v1")
