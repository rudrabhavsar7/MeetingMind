import uuid
from typing import Protocol

from app.models.meeting import TranscriptSegment


class STTModelConfig:
    def __init__(self, model_size: str = "base", device: str = "cpu"):
        self.model_size = model_size
        self.device = device


class STTService(Protocol):
    async def transcribe_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes, start_time: float) -> list[TranscriptSegment]:
        ...

    async def transcribe_batch(self, meeting_id: uuid.UUID, file_path: str) -> list[TranscriptSegment]:
        ...


class DiarizationService(Protocol):
    async def diarize_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes) -> dict:
        ...

    async def diarize_batch(self, meeting_id: uuid.UUID, file_path: str) -> dict:
        ...


class MockSTTService:
    async def transcribe_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes, start_time: float) -> list[TranscriptSegment]:
        # Dummy implementation that would eventually be replaced by faster-whisper
        return []

    async def transcribe_batch(self, meeting_id: uuid.UUID, file_path: str) -> list[TranscriptSegment]:
        return []


class MockDiarizationService:
    async def diarize_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes) -> dict:
        # Dummy implementation that would eventually be replaced by pyannote.audio
        return {}

    async def diarize_batch(self, meeting_id: uuid.UUID, file_path: str) -> dict:
        return {}
