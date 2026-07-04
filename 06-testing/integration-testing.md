---
Title: MeetingMind — Testing: Integration Testing
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: 06-testing/testing-strategy.md
---

# MeetingMind Testing: Integration Testing

## 1. Overview
Integration tests verify that different modules or services work correctly together. For MeetingMind, this primarily means testing the FastAPI endpoints against a real database, and testing the Celery tasks executing against a mocked external API.

## 2. Backend Integration Testing

### 2.1 The Setup
Integration tests require a real PostgreSQL database with the `pgvector` extension installed.
* In GitHub Actions, use a Service Container.
* Locally, developers should have a `docker-compose.test.yml` that spins up a clean test database.

### 2.2 Testing API Endpoints
Use FastAPI's `TestClient` (or `httpx.AsyncClient`).

```python
import pytest
from httpx import AsyncClient
from myapp.main import app

@pytest.mark.asyncio
async def test_create_meeting_flow(db_session, auth_headers):
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 1. Create Live Extension Capture Session
        response = await client.post(
            "/api/v1/workspaces/ws_123/meetings/live",
            headers=auth_headers,
            json={
                "title": "Q3 Planning",
                "client_type": "chrome_extension",
                "source_app": "google_meet",
                "source_url": "https://meet.google.com/abc-defg-hij",
                "source_title": "Q3 Planning - Google Meet",
            },
        )
        assert response.status_code == 201
        meeting_id = response.json()["data"]["id"]
        
        # 2. Verify Database State
        response = await client.get(f"/api/v1/workspaces/ws_123/meetings/{meeting_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["data"]["title"] == "Q3 Planning"
        assert response.json()["data"]["source_app"] == "google_meet"
```

## 3. Frontend Integration Testing

### 3.1 Tools
We use `@testing-library/react` combined with `msw` (Mock Service Worker).

### 3.2 The Setup
Instead of mocking `fetch` directly, `msw` intercepts real HTTP requests at the network level and returns predefined responses. This allows us to test the entire React Query data-fetching lifecycle.

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { server } from '../mocks/server'
import { rest } from 'msw'
import Dashboard from './Dashboard'

test('loads and displays meetings', async () => {
  // Arrange: Intercept API call
  server.use(
    rest.get('/api/v1/meetings', (req, res, ctx) => {
      return res(ctx.json({ data: [{ id: '1', title: 'Q3 Planning' }] }))
    })
  )

  // Act: Render full page
  render(<Dashboard />)

  // Assert: Check loading state, then data state
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('Q3 Planning')).toBeInTheDocument()
  })
})
```

## 4. Key Rules for Integration Tests
1. **Database Cleansing:** Every test MUST start with a clean database. Use pytest fixtures to truncate tables or rollback transactions after every test.
2. **Mock External APIs:** Any call that leaves the local network (OpenAI, AWS S3, SendGrid) MUST be mocked. Integration tests should be able to run on an airplane without WiFi.
