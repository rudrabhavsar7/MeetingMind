import uuid
from typing import Protocol

from app.models.ai import SummaryVersion
from app.models.meeting import ActionItem, Decision


class LLMService(Protocol):
    async def generate_summary(
        self, meeting_id: uuid.UUID, transcript_text: str
    ) -> SummaryVersion: ...

    async def extract_action_items(
        self, meeting_id: uuid.UUID, transcript_text: str
    ) -> list[ActionItem]: ...

    async def extract_decisions(
        self, meeting_id: uuid.UUID, transcript_text: str
    ) -> list[Decision]: ...


class MockLLMService:
    async def generate_summary(self, meeting_id: uuid.UUID, transcript_text: str) -> SummaryVersion:
        # Dummy implementation to be replaced by Ollama logic
        return SummaryVersion(version=1, executive_summary="Mock summary")

    async def extract_action_items(
        self, meeting_id: uuid.UUID, transcript_text: str
    ) -> list[ActionItem]:
        return []

    async def extract_decisions(
        self, meeting_id: uuid.UUID, transcript_text: str
    ) -> list[Decision]:
        return []
