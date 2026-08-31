from __future__ import annotations

import logging
import uuid

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.summarization.generate_summary", max_retries=3)
def generate_summary(self, meeting_id: str, workspace_id: str) -> dict[str, object]:
    import asyncio

    from sqlalchemy import select

    from app.core.config import get_settings
    from app.db.session import async_session_factory
    from app.models.ai import SummaryVersion as SummaryVersionModel
    from app.models.enums import MeetingStatus, SummaryKind, SummaryStatus
    from app.models.meeting import Meeting, TranscriptSegment
    from app.services.ai import MockLLMService, OllamaLLMService, OpenAILLMService

    settings = get_settings()
    mid = uuid.UUID(meeting_id)
    wid = uuid.UUID(workspace_id)

    async def _run():
        async with async_session_factory() as session:
            meeting = await session.get(Meeting, mid)
            if not meeting:
                return {"status": "error", "detail": "meeting_not_found"}

            meeting.status = MeetingStatus.SUMMARIZING
            await session.commit()

            if settings.use_mock_ai or settings.llm_provider == "mock":
                llm = MockLLMService()
            elif settings.llm_provider == "ollama":
                llm = OllamaLLMService(model=settings.llm_model, base_url=settings.llm_base_url or "http://localhost:11434")
            else:
                api_key = settings.llm_api_key.get_secret_value() if settings.llm_api_key else None
                llm = OpenAILLMService(model=settings.llm_model, api_key=api_key)

            try:
                seg_stmt = select(TranscriptSegment).where(TranscriptSegment.meeting_id == mid).order_by(TranscriptSegment.start_time)
                result = await session.execute(seg_stmt)
                segments = list(result.scalars().all())
                transcript_text = "\n".join(f"[{s.speaker_label}] {s.text}" for s in segments)

                summary = await llm.generate_summary(mid, transcript_text)
                action_items = await llm.extract_action_items(mid, transcript_text)
                decisions = await llm.extract_decisions(mid, transcript_text)

                latest_version = 1
                vs_stmt = (
                    select(SummaryVersionModel)
                    .where(SummaryVersionModel.meeting_id == mid)
                    .order_by(SummaryVersionModel.version.desc())
                    .limit(1)
                )
                vs_result = await session.execute(vs_stmt)
                latest = vs_result.scalar_one_or_none()
                if latest:
                    latest.status = SummaryStatus.SUPERSEDED
                    latest_version = latest.version + 1

                sv = SummaryVersionModel(
                    workspace_id=wid,
                    meeting_id=mid,
                    version=latest_version,
                    kind=SummaryKind.AUTO,
                    executive_summary=summary.executive_summary,
                    key_points=summary.key_points if hasattr(summary, "key_points") else [],
                    status=SummaryStatus.CURRENT,
                )
                session.add(sv)

                for ai in action_items:
                    ai.workspace_id = wid
                    ai.meeting_id = mid
                    session.add(ai)
                for dec in decisions:
                    dec.workspace_id = wid
                    dec.meeting_id = mid
                    session.add(dec)

                meeting.current_summary_version_id = sv.id
                meeting.status = MeetingStatus.COMPLETED
                await session.commit()

                return {
                    "status": "completed",
                    "meeting_id": meeting_id,
                    "summary_version": latest_version,
                    "action_items_count": len(action_items),
                    "decisions_count": len(decisions),
                }
            except Exception as exc:
                meeting.status = MeetingStatus.PROCESSING_FAILED
                meeting.last_error_code = "SUMMARIZATION_FAILED"
                meeting.last_error_message = str(exc)[:500]
                await session.commit()
                logger.exception("Summarization failed for meeting %s", meeting_id)
                raise self.retry(exc=exc, countdown=60) from exc

    return asyncio.get_event_loop().run_until_complete(_run())
