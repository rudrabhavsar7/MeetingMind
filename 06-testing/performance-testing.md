---
Title: MeetingMind — Testing: Performance Testing
Version: 1.0.0
Status: Approved
Owner: Lead QA Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Testing: Performance Testing

## 1. Overview
Performance testing ensures MeetingMind can handle the load of concurrent users, massive meeting transcripts, and heavy AI processing without degrading the user experience.

## 2. Load Testing (Backend APIs)
Simulating concurrent user traffic against the FastAPI backend.

### 2.1 Tools
* **k6 (by Grafana):** Scriptable load testing tool.

### 2.2 Scenarios
* **The Dashboard Spike:** 500 concurrent users logging in and fetching their `GET /meetings` list.
* **The Live Capture Wave:** 50 concurrent extension sessions creating live meetings with `POST /workspaces/{wid}/meetings/live` and streaming 250-500ms audio chunks over `WS /workspaces/{wid}/meetings/{id}/stream`.
* **The Import Backfill Wave:** 25 concurrent users importing 1GB historical recordings via the `POST /workspaces/{wid}/meetings/import/presigned-url` fallback flow.
* **The RAG Query:** 100 concurrent users asking a question via `POST /ai/chat`.

### 2.3 Success Criteria
* P95 Latency < 200ms for standard CRUD endpoints.
* Zero dropped database connections.

## 3. Worker Stress Testing (Celery Pipeline)
The Celery workers are the bottleneck. If they get overloaded, users wait hours for their transcripts.

### 3.1 Simulation
Write a script that drops 1,000 dummy audio processing tasks into the Redis queue simultaneously.

### 3.2 Success Criteria
* The ECS Auto Scaling Group successfully scales out the worker count from 2 to 20 within 5 minutes.
* No tasks are dropped from the queue.
* The system scales back down to 2 workers after the queue hits 0.

## 4. Frontend Performance Testing (Lighthouse)
Ensure the Next.js application remains fast and responsive on client devices.

### 4.1 Automated Checks
Integrate Google Lighthouse into the CI/CD pipeline using the `@lhci/cli` (Lighthouse CI).

### 4.2 Critical Metrics
* **First Contentful Paint (FCP):** < 1.5s
* **Largest Contentful Paint (LCP):** < 2.5s (Crucial for the Dashboard loading).
* **Cumulative Layout Shift (CLS):** < 0.1 (Prevent the UI from jumping around when AI summaries pop in).
* **Time to Interactive (TTI):** < 3.8s

### 4.3 Virtualization Validation
The `TranscriptViewer` component *must* be tested with a mock 4-hour meeting (approx. 40,000 words / 2,000 DOM nodes).
* **Manual Test:** Scroll rapidly from top to bottom. If the browser tab freezes or drops below 30FPS, the `tanstack/react-virtual` implementation is flawed and must be fixed.
