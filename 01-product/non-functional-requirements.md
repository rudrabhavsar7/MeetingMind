---
Title: MeetingMind — Non-Functional Requirements
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-06-28
Dependencies: 01-product/prd.md, 01-product/trd.md
---

# MeetingMind — Non-Functional Requirements (NFRs)

This document specifies the systemic qualities MeetingMind must exhibit to be considered successful. These requirements define *how* the system operates rather than *what* it does.

## 1. Performance Requirements

### 1.1 API Response Times
* **Standard CRUD Operations:** 95th percentile (p95) response time must be **< 200ms**.
* **Vector Search (Retrieval):** pgvector queries must complete in **< 300ms**.
* **LLM Inference (RAG):** Time-To-First-Token (TTFT) over SSE must be **< 1500ms**.
* **Measurement:** Monitored continuously via Prometheus metrics exposed by FastAPI.

### 1.2 Processing Throughput
* **Audio Extraction:** Must process 1 hour of audio in **< 1 minute** (FFmpeg).
* **Transcription (CPU):** Must transcribe 1 hour of audio in **< 15 minutes** (using a standard 8-core CPU).
* **Transcription (GPU):** Must transcribe 1 hour of audio in **< 3 minutes** (using an NVIDIA T4 or better).
* **Measurement:** Tracked via Celery task duration metrics.

### 1.3 Frontend Performance (Core Web Vitals)
* **Largest Contentful Paint (LCP):** Must occur within **2.5 seconds** of page load.
* **First Input Delay (FID):** Must be **< 100 milliseconds**.
* **Cumulative Layout Shift (CLS):** Must be **< 0.1**.
* **Measurement:** Validated in CI/CD using Lighthouse CLI.

## 2. Scalability Requirements

MeetingMind v1.0 is designed for single-organization, self-hosted deployments.
* **Concurrent Users:** The API and DB must gracefully handle **100 concurrent active users**.
* **Data Volume:** The database schema and indexes must maintain p95 performance targets with **10,000 meetings** (approx. 1M vector chunks).
* **Storage Volume:** The system must handle **up to 10TB** of object storage in MinIO without application degradation.

## 3. Reliability & Availability

* **Uptime Target:** Designed for **99.9%** availability (excluding planned maintenance).
* **Mean Time To Recovery (MTTR):** In the event of a container crash (e.g., Celery worker OOM), the Docker Compose restart policies must restore service in **< 2 minutes**.
* **Task Resilience:** Background tasks must be idempotent. If a transcription task fails midway, it must be retryable without corrupting the database.

## 4. Security Requirements

### 4.1 Data Protection
* **Data at Rest:** Vector embeddings, transcripts, and metadata must be stored in PostgreSQL. (Encryption at rest is delegated to the host OS / volume encryption).
* **Data in Transit:** All client-server communication MUST occur over HTTPS/TLS 1.2+.
* **Data Sovereignty:** The system MUST NOT make external API calls to third-party services (e.g., OpenAI, Anthropic, Google) for transcription or summarization. All processing is strictly local.

### 4.2 Application Security
* **Authentication:** Stateless JWT using HS256 algorithm with strong secrets.
* **Authorization:** Every API endpoint (except auth) must validate the user's token and their permission to access the requested Workspace.
* **Input Validation:** All incoming API payloads must be validated against strict Pydantic schemas to prevent injection attacks.
* **Cross-Site Scripting (XSS):** Next.js / React must be used safely (no dangerous `innerHTML` without DOMPurify).
* **Cross-Site Request Forgery (CSRF):** Prevented via strict CORS policies and SameSite cookie attributes.

## 5. Maintainability & Code Quality

* **Test Coverage:** The backend (FastAPI) and core frontend logic must maintain **> 80%** test coverage.
* **Static Analysis:** 
  * Python code must pass `ruff` linting and `mypy` strict type checking.
  * TypeScript code must pass `eslint` and `tsc --noEmit`.
* **CI/CD Pipeline:** Build and test pipelines (GitHub Actions) must execute in **< 5 minutes** to maintain developer velocity.

## 6. Accessibility (A11y)

* **Compliance Level:** The user interface must comply with **WCAG 2.2 Level AA** guidelines.
* **Keyboard Navigation:** All critical flows (upload, search, read transcript) must be fully navigable via keyboard.
* **Screen Readers:** Semantic HTML and appropriate ARIA labels must be utilized, particularly for dynamic components like Modals and Command Palettes.
* **Contrast:** The design system (Emerald + Neutral) must maintain a minimum contrast ratio of 4.5:1 for standard text.
