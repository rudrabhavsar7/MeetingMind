---
Title: MeetingMind — Testing Strategy
Version: 1.0.0
Status: Approved
Owner: QA Lead
Last Updated: 2026-06-28
Dependencies: None
Related Documents:
  - 00-project/success-metrics.md
---

# MeetingMind — Testing Strategy

To maintain stability and user trust, MeetingMind enforces a strict testing pyramid. All code merged into `develop` and `main` must pass the automated test suites running in GitHub Actions.

## 1. The Testing Pyramid

1. **Unit Tests (Fast, 70% of tests):** Test individual functions, hooks, and services in isolation.
2. **Integration Tests (Medium, 20% of tests):** Test database queries, API endpoints, and React component trees.
3. **End-to-End Tests (Slow, 10% of tests):** Test full user journeys in a real browser against a spun-up environment.

## 2. Frontend Testing (Next.js)

### 2.1 Unit & Component Tests (`Vitest` + `React Testing Library`)
* Test utility functions (`formatDate`, `cn`) extensively.
* Test dumb UI components for state changes based on props.
* Mock `next/navigation` and `useUserStore`.

```tsx
import { render, screen } from '@testing-library/react'
import { MeetingCard } from './MeetingCard'

test('displays meeting title and date', () => {
  render(<MeetingCard title="Q3 Planning" date="2026-08-01" />)
  expect(screen.getByText('Q3 Planning')).toBeInTheDocument()
})
```

### 2.2 E2E Tests (`Playwright`)
* Run full browser tests for critical flows: Login, File Upload, RAG Search.
* Use `data-testid` attributes on critical UI elements instead of relying on brittle CSS classes or translated text.

```typescript
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'maya@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## 3. Backend Testing (FastAPI)

### 3.1 Unit Tests (`Pytest`)
* Test service layer logic by mocking the database session and external API calls (e.g., Ollama).
* Use `pytest-asyncio` for all async functions.

### 3.2 API Integration Tests
* Use `httpx.AsyncClient` alongside FastAPI's `TestClient`.
* Use a separate testing database (PostgreSQL in a Docker container).
* Fixtures must truncate tables between tests to ensure a clean state.

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_meeting(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.post(
        "/api/v1/meetings",
        json={"title": "Test Sync"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["data"]["title"] == "Test Sync"
```

## 4. AI Pipeline Testing (Evaluations)

Testing the LLM and RAG pipeline is fundamentally different from deterministic code. We use specialized evaluations running in a separate CI pipeline.

* **Golden Dataset:** A fixed set of 10 meeting transcripts with human-verified summaries and action items.
* **Accuracy Metrics:** Whenever a prompt template or model is changed, a script runs the golden dataset through the pipeline and calculates:
  * **ROUGE-L:** Overlap between generated summary and golden summary.
  * **Precision/Recall:** For extracted action items.
* **Regression:** If ROUGE-L drops by more than 5%, the CI pipeline fails.

## 5. Test Coverage

* We enforce a hard minimum of **80% line coverage** for the backend `app/services` and `app/api` directories, measured by `pytest-cov`.
* Frontend hooks (`hooks/`) must have **90% coverage**.
* Coverage is tracked and visualized in PRs via Codecov or SonarQube.
