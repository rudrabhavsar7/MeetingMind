---
Title: MeetingMind — Testing: Strategy
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Testing: Overall Strategy

## 1. Overview
Given the complexity of MeetingMind—spanning frontend UI, backend APIs, asynchronous Celery pipelines, and non-deterministic AI models—a robust, multi-layered testing strategy is required to ensure stability.

## 2. The Testing Pyramid
We follow a standard testing pyramid, prioritizing fast, deterministic tests at the bottom and reserving slower, complex tests for the top.

### 2.1 Unit Tests (The Base)
* **What:** Testing individual functions, utilities, and isolated components.
* **Tools:** `pytest` (Backend), `Vitest` (Frontend).
* **Coverage Goal:** 80%+ on business logic. 0% on external LLM calls (mock them).
* **Execution Time:** < 1 minute for the entire suite. Runs on every commit.

### 2.2 Integration Tests (The Middle)
* **What:** Testing how components interact. API endpoints, database queries, and synchronous Celery task execution.
* **Tools:** `pytest` with `TestClient` and an ephemeral Postgres database.
* **Execution Time:** ~3-5 minutes. Runs on every Pull Request.

### 2.3 End-to-End (E2E) Tests (The Peak)
* **What:** Testing the entire application stack from the user's perspective in a real browser.
* **Tools:** Playwright.
* **Execution Time:** ~10-15 minutes. Runs nightly against the `develop` branch, or before a production release.

## 3. Testing AI Features (The Challenge)
Traditional assertions (`assert text == "Expected Output"`) fail when testing LLMs because their output is non-deterministic.

### Strategy for AI Testing:
1. **Mock the LLM in Standard CI:** During normal PRs, all calls to OpenAI/Ollama are intercepted and mocked to return a static string. This ensures the *pipeline plumbing* works.
2. **Dedicated "Eval" Suite:** A separate test suite runs on a schedule (e.g., weekly) that *does* call the real LLM. Instead of asserting exact string matches, it uses a stronger LLM (like GPT-4) as a "Judge" to evaluate the output against a rubric (e.g., "Did this summary capture the 3 main points?").

## 4. Test Environments
* **CI Environment:** Ephemeral Docker containers spun up by GitHub Actions.
* **Staging Environment:** A persistent cloud environment used for Playwright E2E tests and manual QA before production.

## 5. Shift-Left Testing
Developers are responsible for writing Unit and Integration tests for their own features *before* submitting a PR. The QA team focuses on E2E test automation and complex exploratory testing.
