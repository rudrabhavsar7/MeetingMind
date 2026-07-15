---
Title: MeetingMind — Testing: Strategy
Version: 1.1.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-07-11
Dependencies: 05-devops/environments.md
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
1. **Mock Providers in Standard CI:** During normal PRs, local-model and optional external-provider adapters return deterministic typed fixtures. CI makes no model-network calls.
2. **Dedicated Local Eval Suite:** A separate scheduled/manual suite calls the pinned local v1 models against licensed synthetic/golden meeting fixtures and scores task-specific rubrics, citation coverage, and schema validity. An external judge may be used only in a separately authorized opt-in evaluation with non-production inputs and recorded provider/model provenance.

## 4. Test Environments
* **CI Environment:** Ephemeral Docker containers spun up by GitHub Actions.
* **Staging Environment:** An isolated application deployment using the Supabase PostgreSQL `meetingmind_staging` schema and staging-only role, plus separate local/self-hosted Redis, MinIO, and model services. It uses synthetic QA data and local models/provider fakes for Playwright and manual QA. Supabase services other than PostgreSQL/pgvector are not used.

## 5. Shift-Left Testing
Developers are responsible for writing Unit and Integration tests for their own features *before* submitting a PR. The QA team focuses on E2E test automation and complex exploratory testing.
