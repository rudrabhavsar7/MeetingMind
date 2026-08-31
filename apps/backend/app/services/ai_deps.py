from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.services.ai import LLMService, MockLLMService, OllamaLLMService, OpenAILLMService
from app.services.transcription import (
    DiarizationService,
    FasterWhisperSTTService,
    MockDiarizationService,
    MockSTTService,
    PyannoteDiarizationService,
    STTService,
)


def get_stt_service(settings: Annotated[Settings, Depends(get_settings)]) -> STTService:
    if settings.use_mock_ai:
        return MockSTTService()
    return FasterWhisperSTTService(
        model_size=settings.stt_model_size,
        device=settings.stt_device,
        language=settings.stt_language,
    )


def get_diarization_service(settings: Annotated[Settings, Depends(get_settings)]) -> DiarizationService:
    if settings.use_mock_ai:
        return MockDiarizationService()
    token = settings.diarization_huggingface_token.get_secret_value() if settings.diarization_huggingface_token else None
    return PyannoteDiarizationService(
        model_name=settings.diarization_model,
        hf_token=token,
    )


def get_llm_service(settings: Annotated[Settings, Depends(get_settings)]) -> LLMService:
    if settings.use_mock_ai or settings.llm_provider == "mock":
        return MockLLMService()
    if settings.llm_provider == "ollama":
        return OllamaLLMService(model=settings.llm_model, base_url=settings.llm_base_url or "http://localhost:11434")
    api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
    return OpenAILLMService(model=settings.llm_model, api_key=api_key)
