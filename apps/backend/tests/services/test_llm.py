import uuid

import pytest


@pytest.mark.asyncio
async def test_mock_llm_summary():
    from app.services.ai import MockLLMService

    llm = MockLLMService()
    result = await llm.generate_summary(uuid.uuid4(), "Hello world")
    assert result.executive_summary == "Mock summary"


@pytest.mark.asyncio
async def test_mock_llm_action_items():
    from app.services.ai import MockLLMService

    llm = MockLLMService()
    result = await llm.extract_action_items(uuid.uuid4(), "Hello world")
    assert result == []


@pytest.mark.asyncio
async def test_mock_llm_decisions():
    from app.services.ai import MockLLMService

    llm = MockLLMService()
    result = await llm.extract_decisions(uuid.uuid4(), "Hello world")
    assert result == []


def test_llm_deps_returns_mock_when_use_mock_ai():
    from app.services.ai_deps import get_llm_service
    from app.services.ai import MockLLMService
    from app.core.config import Settings

    settings = Settings(jwt_secret="test-secret-32-bytes-long!!!!!!!!")
    llm = get_llm_service(settings)
    assert isinstance(llm, MockLLMService)
