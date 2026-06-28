---
Title: MeetingMind — Testing: Unit Testing
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: 06-testing/testing-strategy.md
---

# MeetingMind Testing: Unit Testing

## 1. Overview
Unit tests form the foundation of our testing strategy. They are fast, isolated, and deterministic.

## 2. Frontend Unit Testing

### 2.1 Tools
* **Framework:** `Vitest` (Faster alternative to Jest, native to Vite/Next.js ecosystems).
* **DOM Rendering:** `@testing-library/react`.
* **Mocking:** `msw` (Mock Service Worker) for intercepting API calls.

### 2.2 What to Test
* Complex pure functions (e.g., date formatters, timestamp parsers).
* UI Component logic (e.g., "Does the MeetingCard render an Avatar if participants exist?").
* Custom React Hooks (`useMeetingStatus`).

### 2.3 What NOT to Test
* Do not test if Tailwind classes apply correctly (that's visual regression testing).
* Do not test third-party library internals (e.g., don't test if shadcn's Accordion opens, test that *our* component passes the right props to it).

### 2.4 Example Component Test
```tsx
import { render, screen } from '@testing-library/react'
import { MeetingCard } from './meeting-card'

test('renders participants if provided', () => {
  render(<MeetingCard title="Test" participants={[{ name: "Alex" }]} />)
  expect(screen.getByText('Alex')).toBeInTheDocument()
})

test('renders fallback text if no participants', () => {
  render(<MeetingCard title="Test" participants={[]} />)
  expect(screen.queryByText('Alex')).toBeNull()
})
```

## 3. Backend Unit Testing

### 3.1 Tools
* **Framework:** `pytest`.
* **Mocking:** `pytest-mock`.

### 3.2 What to Test
* Pydantic validation schemas.
* Custom utility functions (e.g., `calculate_meeting_duration`).
* Prompt formatting logic (ensure variables inject correctly into the string).

### 3.3 Example Backend Test
```python
import pytest
from myapp.utils import chunk_text

def test_chunk_text_splits_correctly():
    text = "A" * 1000
    chunks = chunk_text(text, max_length=500, overlap=50)
    
    assert len(chunks) == 3
    assert len(chunks[0]) == 500
    assert chunks[1].startswith("A" * 50) # tests overlap
```

## 4. Best Practices
* **Arrange, Act, Assert (AAA):** Structure all tests using this pattern for readability.
* **Don't Mock Too Much:** If you are mocking 10 different internal functions to test one function, your function is probably too coupled. Refactor it.
* **Naming Convention:** Use descriptive names like `test_feature_when_condition_expects_result()`.
