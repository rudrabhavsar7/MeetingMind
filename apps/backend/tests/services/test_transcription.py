import uuid

import pytest


@pytest.mark.asyncio
async def test_mock_stt_returns_empty():
    from app.services.transcription import MockSTTService

    stt = MockSTTService()
    result = await stt.transcribe_chunk(uuid.uuid4(), b"\x00\x00", 0.0)
    assert result == []


@pytest.mark.asyncio
async def test_mock_stt_batch_returns_empty():
    from app.services.transcription import MockSTTService

    stt = MockSTTService()
    result = await stt.transcribe_batch(uuid.uuid4(), "/tmp/fake.wav")
    assert result == []


@pytest.mark.asyncio
async def test_mock_diarization_returns_empty():
    from app.services.transcription import MockDiarizationService

    diar = MockDiarizationService()
    result = await diar.diarize_chunk(uuid.uuid4(), b"\x00\x00")
    assert result == {}


@pytest.mark.asyncio
async def test_mock_diarization_batch_returns_empty():
    from app.services.transcription import MockDiarizationService

    diar = MockDiarizationService()
    result = await diar.diarize_batch(uuid.uuid4(), "/tmp/fake.wav")
    assert result == {}


@pytest.mark.asyncio
async def test_config_use_mock_ai_default():
    from app.core.config import Settings

    s = Settings(jwt_secret="test-secret-32-bytes-long!!!!!!!!!")
    assert s.use_mock_ai is True


def test_ai_deps_returns_mock_when_use_mock_ai():
    from app.core.config import Settings
    from app.services.ai_deps import get_diarization_service, get_stt_service
    from app.services.transcription import MockDiarizationService, MockSTTService

    settings = Settings(jwt_secret="test-secret-32-bytes-long!!!!!!!!")
    stt = get_stt_service(settings)
    diar = get_diarization_service(settings)
    assert isinstance(stt, MockSTTService)
    assert isinstance(diar, MockDiarizationService)
