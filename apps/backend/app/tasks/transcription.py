from __future__ import annotations

import logging
import uuid

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.transcription.process_audio", max_retries=3)
def process_audio(self, meeting_id: str, workspace_id: str, file_path: str) -> dict[str, object]:
    import asyncio
    from datetime import UTC, datetime

    from app.core.config import get_settings
    from app.db.session import async_session_factory
    from app.models.enums import MeetingStatus
    from app.models.meeting import Meeting, MeetingParticipant
    from app.services.transcription import (
        FasterWhisperSTTService,
        MockDiarizationService,
        MockSTTService,
        PyannoteDiarizationService,
    )

    settings = get_settings()
    mid = uuid.UUID(meeting_id)
    wid = uuid.UUID(workspace_id)

    async def _run():
        async with async_session_factory() as session:
            meeting = await session.get(Meeting, mid)
            if not meeting:
                logger.error("Meeting %s not found", meeting_id)
                return {"status": "error", "detail": "meeting_not_found"}

            meeting.status = MeetingStatus.TRANSCRIBING
            await session.commit()

            if settings.use_mock_ai:
                stt = MockSTTService()
                diar = MockDiarizationService()
            else:
                stt = FasterWhisperSTTService(
                    model_size=settings.stt_model_size,
                    device=settings.stt_device,
                    language=settings.stt_language,
                )
                token = settings.diarization_huggingface_token.get_secret_value() if settings.diarization_huggingface_token else None
                diar = PyannoteDiarizationService(model_name=settings.diarization_model, hf_token=token)

            try:
                segments = await stt.transcribe_batch(mid, file_path)
                diarization = await diar.diarize_batch(mid, file_path)

                speaker_map: dict[str, str] = {}
                diar_segments = diarization.get("segments", [])
                for seg in diar_segments:
                    speaker_map[seg["speaker"]] = f"Speaker {seg['speaker'][-1:]}" if seg["speaker"] else "Unknown"

                for idx, seg in enumerate(segments):
                    matched_speaker = "SPEAKER_00"
                    for ds in diar_segments:
                        if ds["start"] <= seg.start_time <= ds["end"] or ds["start"] <= seg.end_time <= ds["end"]:
                            matched_speaker = ds["speaker"]
                            break
                    seg.speaker_label = matched_speaker
                    seg.sequence_number = idx
                    seg.workspace_id = wid
                    session.add(seg)

                participants: dict[str, MeetingParticipant] = {}
                for ds in diar_segments:
                    spk = ds["speaker"]
                    if spk not in participants:
                        p = MeetingParticipant(
                            workspace_id=wid,
                            meeting_id=mid,
                            display_name=speaker_map.get(spk, spk),
                            first_seen_at=datetime.fromtimestamp(ds["start"], tz=UTC),
                            last_seen_at=datetime.fromtimestamp(ds["end"], tz=UTC),
                        )
                        session.add(p)
                        participants[spk] = p

                meeting.status = MeetingStatus.TRANSCRIBED
                meeting.duration_seconds = int((meeting.ended_at - meeting.started_at).total_seconds()) if meeting.ended_at else None
                await session.commit()

                return {
                    "status": "completed",
                    "meeting_id": meeting_id,
                    "segments_created": len(segments),
                    "speakers_found": len(participants),
                }
            except Exception as exc:
                meeting.status = MeetingStatus.PROCESSING_FAILED
                meeting.last_error_code = "TRANSCRIPTION_FAILED"
                meeting.last_error_message = str(exc)[:500]
                await session.commit()
                logger.exception("Transcription failed for meeting %s", meeting_id)
                raise self.retry(exc=exc, countdown=60) from exc

    return asyncio.get_event_loop().run_until_complete(_run())
