---
Title: MeetingMind — Backend: Celery Task Tests
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/ai-pipeline.md
---

# MeetingMind Backend: Celery Task Testing Strategy

## 1. Overview
Testing the asynchronous Celery pipeline is entirely different from testing FastAPI endpoints. These tests focus on complex data transformations, file I/O, and interactions with AI models.

## 2. Testing Philosophy
* **Unit Tests:** Test individual utility functions (e.g., prompt formatting, text chunking) synchronously without Celery context.
* **Integration Tests:** Test the actual Celery tasks. To do this, configure Celery in the test environment to execute tasks synchronously.

## 3. Configuring Celery for Tests
In your `conftest.py`, force Celery to run eagerly (synchronously). This prevents the need to spin up a Redis broker and separate worker process just for pytest.

```python
import pytest

@pytest.fixture(scope='session')
def celery_config():
    return {
        'broker_url': 'memory://',
        'result_backend': 'cache+memory://',
        'task_always_eager': True,
        'task_eager_propagates': True,
    }
```
*Setting `task_always_eager = True` ensures `my_task.delay()` blocks and executes immediately in the test thread.*

## 4. Testing File Operations (FFmpeg)
Do not use real 2GB video files for tests.
* Create a tiny, valid 1-second audio file (`test_beep.wav`) and store it in `tests/fixtures/`.
* Write a test that passes this fixture to the `extract_audio` task and asserts that the resulting output file exists and is the correct format (e.g., 16kHz mono).

## 5. Mocking the LLM (OpenAI / Ollama)
**CRITICAL:** Never make real network calls to OpenAI in CI/CD tests. It costs money, it's slow, and it's flaky.

Use `pytest-mock` or `responses` to intercept HTTP calls to the LLM API and return a static, predictable JSON response.

```python
def test_generate_action_items(mocker, db_session):
    # Mock the LLM service to return a canned response
    mock_llm_response = {
        "action_items": [
            {"task": "Fix the bug", "assignee": "Alex"}
        ]
    }
    mocker.patch(
        "myapp.ai.llm_service.call_llm_structured", 
        return_value=mock_llm_response
    )
    
    # Execute the Celery task synchronously
    result = extract_action_items_task.apply(args=["test-meeting-id"]).get()
    
    # Assert database state changed
    items = db_session.query(ActionItem).all()
    assert len(items) == 1
    assert items[0].assignee_name == "Alex"
```

## 6. Testing the Vector Pipeline
1. Mock the embedding provider to return a random array of 768 floats (e.g., `[0.1, -0.4, ...]`).
2. Run the chunking and embedding task.
3. Query the test PostgreSQL database and assert the rows were inserted.
4. Execute a similarity search query using a mocked query vector and assert it returns the expected chunk.

## 7. Testing the Failure Path
Celery tasks must handle failure gracefully.
* Mock an S3 download failure.
* Assert that the task catches the exception, logs it, and updates the `Meeting.status` to `FAILED` in the database, rather than just hanging or crashing silently.

## 8. Continuous Integration (CI)
Because these tests rely on PostgreSQL (for `pgvector`) and potentially FFmpeg binaries, the CI pipeline (GitHub Actions/GitLab CI) must use a Docker container that has all these dependencies installed, or utilize Service Containers for the database.
