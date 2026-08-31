from __future__ import annotations

import json
import logging
import uuid
from typing import Protocol

from app.models.ai import SummaryVersion
from app.models.meeting import ActionItem, Decision

logger = logging.getLogger(__name__)


class LLMService(Protocol):
    async def generate_summary(self, meeting_id: uuid.UUID, transcript_text: str) -> SummaryVersion: ...

    async def extract_action_items(self, meeting_id: uuid.UUID, transcript_text: str) -> list[ActionItem]: ...

    async def extract_decisions(self, meeting_id: uuid.UUID, transcript_text: str) -> list[Decision]: ...


class OllamaLLMService:
    def __init__(self, model: str = "llama3.2", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    async def _chat(self, prompt: str) -> str:
        import httpx

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def generate_summary(self, meeting_id: uuid.UUID, transcript_text: str) -> SummaryVersion:
        prompt = (
            "You are a meeting summarizer. Given the following transcript, provide:\n"
            "1. A concise executive summary (2-4 sentences)\n"
            "2. A list of key points (bullet points)\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Respond in JSON format: {"executive_summary": "...", "key_points": ["..."]}'
        )
        try:
            raw = await self._chat(prompt)
            data = json.loads(raw)
            return SummaryVersion(
                version=1,
                executive_summary=data.get("executive_summary", raw[:500]),
                key_points=data.get("key_points", []),
            )
        except Exception as e:
            logger.warning("LLM summary failed: %s", e)
            return SummaryVersion(version=1, executive_summary="Summary generation failed.", key_points=[])

    async def extract_action_items(self, meeting_id: uuid.UUID, transcript_text: str) -> list[ActionItem]:
        prompt = (
            "Extract action items from this meeting transcript. "
            "Each action item should have: text, assignee_name (if mentioned), due_date (if mentioned).\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Respond in JSON format: [{"text": "...", "assignee_name": "...", "due_date": "..."}]'
        )
        try:
            raw = await self._chat(prompt)
            data = json.loads(raw)
            items = []
            for item in data:
                items.append(ActionItem(
                    workspace_id=uuid.uuid4(),
                    meeting_id=meeting_id,
                    text=item.get("text", ""),
                    assignee_name=item.get("assignee_name"),
                ))
            return items
        except Exception as e:
            logger.warning("LLM action item extraction failed: %s", e)
            return []

    async def extract_decisions(self, meeting_id: uuid.UUID, transcript_text: str) -> list[Decision]:
        prompt = (
            "Extract decisions from this meeting transcript. "
            "Each decision should have: title, text, rationale (if given).\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Respond in JSON format: [{"title": "...", "text": "...", "rationale": "..."}]'
        )
        try:
            raw = await self._chat(prompt)
            data = json.loads(raw)
            decisions = []
            for item in data:
                decisions.append(Decision(
                    workspace_id=uuid.uuid4(),
                    meeting_id=meeting_id,
                    title=item.get("title", "Decision"),
                    text=item.get("text", ""),
                    rationale=item.get("rationale"),
                ))
            return decisions
        except Exception as e:
            logger.warning("LLM decision extraction failed: %s", e)
            return []


class OpenAILLMService:
    def __init__(self, model: str = "gpt-4o-mini", api_key: str | None = None, base_url: str = "https://api.openai.com/v1"):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url

    async def _chat(self, prompt: str) -> str:
        import httpx

        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def generate_summary(self, meeting_id: uuid.UUID, transcript_text: str) -> SummaryVersion:
        prompt = (
            "You are a meeting summarizer. Given the following transcript, provide:\n"
            "1. A concise executive summary (2-4 sentences)\n"
            "2. A list of key points (bullet points)\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Respond in JSON format: {"executive_summary": "...", "key_points": ["..."]}'
        )
        try:
            raw = await self._chat(prompt)
            data = json.loads(raw)
            return SummaryVersion(
                version=1,
                executive_summary=data.get("executive_summary", raw[:500]),
                key_points=data.get("key_points", []),
            )
        except Exception as e:
            logger.warning("OpenAI summary failed: %s", e)
            return SummaryVersion(version=1, executive_summary="Summary generation failed.", key_points=[])

    async def extract_action_items(self, meeting_id: uuid.UUID, transcript_text: str) -> list[ActionItem]:
        prompt = (
            "Extract action items from this meeting transcript. "
            "Each action item should have: text, assignee_name (if mentioned).\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Respond in JSON format: [{"text": "...", "assignee_name": "..."}]'
        )
        try:
            raw = await self._chat(prompt)
            data = json.loads(raw)
            return [ActionItem(workspace_id=uuid.uuid4(), meeting_id=meeting_id, text=i.get("text", ""), assignee_name=i.get("assignee_name")) for i in data]
        except Exception as e:
            logger.warning("OpenAI action item extraction failed: %s", e)
            return []

    async def extract_decisions(self, meeting_id: uuid.UUID, transcript_text: str) -> list[Decision]:
        prompt = (
            "Extract decisions from this meeting transcript. "
            "Each decision should have: title, text, rationale.\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Respond in JSON format: [{"title": "...", "text": "...", "rationale": "..."}]'
        )
        try:
            raw = await self._chat(prompt)
            data = json.loads(raw)
            return [Decision(workspace_id=uuid.uuid4(), meeting_id=meeting_id, title=i.get("title", "Decision"), text=i.get("text", ""), rationale=i.get("rationale")) for i in data]
        except Exception as e:
            logger.warning("OpenAI decision extraction failed: %s", e)
            return []


class MockLLMService:
    async def generate_summary(self, meeting_id: uuid.UUID, transcript_text: str) -> SummaryVersion:
        return SummaryVersion(version=1, executive_summary="Mock summary")

    async def extract_action_items(self, meeting_id: uuid.UUID, transcript_text: str) -> list[ActionItem]:
        return []

    async def extract_decisions(self, meeting_id: uuid.UUID, transcript_text: str) -> list[Decision]:
        return []
