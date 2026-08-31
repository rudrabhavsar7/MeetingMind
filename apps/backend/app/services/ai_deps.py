from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.services.transcription import (
    DiarizationService,
    MockDiarizationService,
    MockSTTService,
    PyannoteDiarizationService,
    STTService,
    FasterWhisperSTTService,
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
