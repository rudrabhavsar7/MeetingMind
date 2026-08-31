from __future__ import annotations

import logging
import uuid
from typing import Any

from app.models.meeting import TranscriptSegment

logger = logging.getLogger(__name__)


class STTModelConfig:
    def __init__(self, model_size: str = "base", device: str = "cpu"):
        self.model_size = model_size
        self.device = device


class STTService:
    async def transcribe_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes, start_time: float) -> list[TranscriptSegment]:
        raise NotImplementedError

    async def transcribe_batch(self, meeting_id: uuid.UUID, file_path: str) -> list[TranscriptSegment]:
        raise NotImplementedError


class DiarizationService:
    async def diarize_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes) -> dict[str, Any]:
        raise NotImplementedError

    async def diarize_batch(self, meeting_id: uuid.UUID, file_path: str) -> dict[str, Any]:
        raise NotImplementedError


class FasterWhisperSTTService(STTService):
    def __init__(self, model_size: str = "base", device: str = "cpu", language: str | None = None):
        self.model_size = model_size
        self.device = device
        self.language = language
        self._model = None

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(self.model_size, device=self.device, compute_type="int8" if self.device == "cpu" else "float16")
        return self._model

    async def transcribe_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes, start_time: float) -> list[TranscriptSegment]:
        import numpy as np

        model = self._get_model()
        audio_np = np.frombuffer(audio_pcm, dtype=np.int16).astype(np.float32) / 32768.0
        segments, info = model.transcribe(audio_np, language=self.language, beam_size=5, vad_filter=True)
        results: list[TranscriptSegment] = []
        for seg in segments:
            results.append(
                TranscriptSegment(
                    workspace_id=uuid.uuid4(),
                    meeting_id=meeting_id,
                    client_instance_id=uuid.uuid4(),
                    speaker_label="SPEAKER_00",
                    start_time=start_time + seg.start,
                    end_time=start_time + seg.end,
                    sequence_number=0,
                    text=seg.text.strip(),
                    is_final=True,
                    stt_confidence=seg.no_speech_prob if hasattr(seg, "no_speech_prob") else None,
                    language=info.language,
                )
            )
        return results

    async def transcribe_batch(self, meeting_id: uuid.UUID, file_path: str) -> list[TranscriptSegment]:
        model = self._get_model()
        segments, info = model.transcribe(file_path, language=self.language, beam_size=5, vad_filter=True)
        results: list[TranscriptSegment] = []
        for idx, seg in enumerate(segments):
            results.append(
                TranscriptSegment(
                    workspace_id=uuid.uuid4(),
                    meeting_id=meeting_id,
                    client_instance_id=uuid.uuid4(),
                    speaker_label="SPEAKER_00",
                    start_time=seg.start,
                    end_time=seg.end,
                    sequence_number=idx,
                    text=seg.text.strip(),
                    is_final=True,
                    stt_confidence=seg.no_speech_prob if hasattr(seg, "no_speech_prob") else None,
                    language=info.language,
                )
            )
        return results


class PyannoteDiarizationService(DiarizationService):
    def __init__(self, model_name: str = "pyannote/speaker-diarization-3.1", hf_token: str | None = None):
        self.model_name = model_name
        self.hf_token = hf_token
        self._pipeline = None

    def _get_pipeline(self):
        if self._pipeline is None:
            from pyannote.audio import Pipeline
            self._pipeline = Pipeline.from_pretrained(self.model_name, use_auth_token=self.hf_token)
        return self._pipeline

    async def diarize_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes) -> dict[str, Any]:
        return {"segments": [], "speaker_count": 0}

    async def diarize_batch(self, meeting_id: uuid.UUID, file_path: str) -> dict[str, Any]:
        import tempfile
        from pathlib import Path

        pipeline = self._get_pipeline()
        try:
            diarization = pipeline(file_path)
            segments: list[dict[str, Any]] = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                segments.append({
                    "start": turn.start,
                    "end": turn.end,
                    "speaker": speaker,
                })
            speakers = {s["speaker"] for s in segments}
            return {"segments": segments, "speaker_count": len(speakers)}
        except Exception as e:
            logger.warning("Diarization failed, returning empty: %s", e)
            return {"segments": [], "speaker_count": 0}


class MockSTTService(STTService):
    async def transcribe_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes, start_time: float) -> list[TranscriptSegment]:
        return []

    async def transcribe_batch(self, meeting_id: uuid.UUID, file_path: str) -> list[TranscriptSegment]:
        return []


class MockDiarizationService(DiarizationService):
    async def diarize_chunk(self, meeting_id: uuid.UUID, audio_pcm: bytes) -> dict[str, Any]:
        return {}

    async def diarize_batch(self, meeting_id: uuid.UUID, file_path: str) -> dict[str, Any]:
        return {}
