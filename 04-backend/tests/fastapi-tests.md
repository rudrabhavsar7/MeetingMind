---
Title: MeetingMind — Backend: FastAPI Tests
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/api-specification.md
---

# MeetingMind Backend: FastAPI Testing Strategy

## 1. Overview
FastAPI provides an excellent built-in `TestClient` (based on `httpx`) that allows for blazing-fast, synchronous-style testing of asynchronous endpoints without needing a running server.

## 2. Test Framework
* **Framework:** `pytest`
* **Async Plugin:** `pytest-asyncio`
* **Client:** `fastapi.testclient.TestClient` or `httpx.AsyncClient` (for testing websockets/advanced async behavior).

## 3. The Testing Database
**Rule #1: Never test against the production or local development database.**

* **Strategy:** Use an ephemeral PostgreSQL database (e.g., spun up via Docker Testcontainers) or a SQLite in-memory database for testing.
* *Note on SQLite:* Since MeetingMind relies heavily on `pgvector` and `JSONB`, SQLite is *not* a viable test database, as it lacks these PostgreSQL-specific features. Tests must run against a real Postgres instance with the vector extension installed.

### 3.1 Database Fixture Setup
```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from myapp.database import Base, get_db

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/test_db"

engine = create_async_engine(TEST_DATABASE_URL)

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session():
    async with AsyncSession(engine) as session:
        yield session
```

## 4. Dependency Overrides
FastAPI's dependency injection system makes it trivial to mock out authentication or database connections during tests.

```python
from myapp.main import app
from myapp.dependencies import get_current_user

def override_get_current_user():
    return User(id="test-uuid", email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user
```

## 5. Testing the Endpoints (Examples)

### 5.1 Testing Authorization (403 Forbidden)
Ensure RBAC works. If User A tries to access Workspace B, they should be blocked.
```python
def test_access_other_workspace(client, test_user_a, test_workspace_b):
    response = client.get(f"/api/v1/workspaces/{test_workspace_b.id}/meetings")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
```

### 5.2 Testing Validation (422 Unprocessable Entity)
Ensure Pydantic schemas correctly reject bad data.
```python
def test_create_meeting_invalid_date(client):
    payload = {"title": "Q3 Review", "date": "not-a-date"}
    response = client.post("/api/v1/workspaces/123/meetings", json=payload)
    assert response.status_code == 422
```

### 5.3 Testing Happy Path (200 OK)
```python
def test_get_meeting_summary(client, test_meeting):
    response = client.get(f"/api/v1/meetings/{test_meeting.id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["title"] == test_meeting.title
    assert "summary" in data
```

## 6. Mocking External APIs
* Do not call OpenAI, S3, or external services during FastAPI endpoint tests.
* Use `pytest-mock` (wrapper around `unittest.mock`) to mock the S3 Presigned URL generator or the Celery `delay()` call.

```python
def test_upload_meeting(client, mocker):
    # Mock the Celery task dispatch so it doesn't actually run in tests
    mock_task = mocker.patch("myapp.tasks.process_meeting.delay")
    
    response = client.post("/api/v1/meetings/upload-complete", json={"meeting_id": "123"})
    assert response.status_code == 202
    mock_task.assert_called_once_with("123")
```
