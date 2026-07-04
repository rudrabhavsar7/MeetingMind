---
Title: MeetingMind — Resources: Architecture Decision Log
Version: 1.0.0
Status: Approved
Owner: Lead Architect
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Resources: Architecture Decision Log (ADR)

## 1. Overview
This document records all significant architectural decisions made during the development of MeetingMind. We follow a lightweight Architecture Decision Record (ADR) format.

---

## ADR 001: Next.js App Router vs Pages Router

* **Date:** 2026-05-10
* **Status:** Accepted
* **Context:** Starting greenfield development for the frontend. Need to choose between Next.js legacy Pages router and the new App router.
* **Decision:** We will use the Next.js 15 App Router exclusively.
* **Consequences:** 
  * *Positive:* Access to React Server Components (RSC) for smaller bundle sizes. Better streaming UI support (crucial for long transcript loading).
  * *Negative:* Steeper learning curve for developers used to the old `getServerSideProps` pattern.

---

## ADR 002: PostgreSQL + pgvector vs Dedicated Vector DB (Pinecone)

* **Date:** 2026-05-15
* **Status:** Accepted
* **Context:** We need a vector database to enable RAG (Semantic Search) over meeting transcripts. Options include a standalone SaaS vector DB (Pinecone, Weaviate) or extending our primary PostgreSQL database with `pgvector`.
* **Decision:** We will use `pgvector` inside PostgreSQL.
* **Consequences:** 
  * *Positive:* Dramatically simplifies infrastructure. Enforcing Workspace-level RBAC is much easier when vectors are in the same database as the user/membership tables. Eliminates the "split-brain" data synchronization problem.
  * *Negative:* Requires careful index tuning (HNSW) and managing Postgres memory, which a managed Vector DB would handle for us.

---

## ADR 003: FastAPI vs Django for the Backend

* **Date:** 2026-05-20
* **Status:** Accepted
* **Context:** Python is required due to the heavy AI/ML ecosystem (Whisper, Pyannote). We need an API framework.
* **Decision:** We will use FastAPI with AsyncIO.
* **Consequences:**
  * *Positive:* Async performance is crucial for an API that acts as a proxy to external LLM APIs and S3. Automatic OpenAPI documentation generation. Pydantic validation is best-in-class.
  * *Negative:* Lacks Django's built-in ORM and admin panel. We must integrate SQLAlchemy and Alembic manually.

---

## ADR 004: Celery vs BackgroundTasks for Async Processing

* **Date:** 2026-05-25
* **Status:** Accepted
* **Context:** Meeting transcription and LLM summarization takes 5-15 minutes. This cannot block the HTTP request.
* **Decision:** We will use Celery with Redis as the broker. We will NOT use FastAPI's built-in `BackgroundTasks`.
* **Consequences:**
  * *Positive:* Celery allows for distributed workers, retries, exponential backoff, and complex routing (e.g., routing GPU tasks to specific EC2 instances).
  * *Negative:* Adds significant infrastructure overhead (Redis, worker containers) compared to a simple thread pool.

---

## ADR 005: Client-Direct Uploads via Presigned URLs

* **Date:** 2026-06-01
* **Status:** Superseded for primary v1 ingestion; retained for recording imports
* **Context:** Users upload 2GB video files. Routing this traffic through the FastAPI server causes massive memory spikes and blocks async workers.
* **Decision:** The frontend will request an S3 Presigned URL from FastAPI, and then upload the file directly to S3 via a `PUT` request.
* **Consequences:**
  * *Positive:* FastAPI server remains highly responsive. Saves 50% on AWS ingress bandwidth costs.
  * *Negative:* Adds complexity to the upload flow (Frontend -> API -> S3 -> Frontend -> API). Requires strict CORS configuration on the S3 bucket.

---

## ADR 006: Real-Time Capture as Primary v1 Ingestion

* **Date:** 2026-07-04
* **Status:** Accepted
* **Context:** Earlier documentation centered the MVP around uploaded recordings, while newer roadmap/API/pipeline direction included live WebSocket processing. The product direction is now real-time-first: MeetingMind should behave as a live meeting assistant, not an upload-only transcription tool.
* **Decision:** v1 primary ingestion is live meeting capture over WebSockets/WebRTC. The frontend creates a live meeting session, streams 250-500ms audio chunks, receives interim/final transcript events, and displays rolling AI summaries/action items. Recording import remains supported as a secondary backfill/fallback path using presigned object-storage uploads and Celery batch processing.
* **Consequences:**
  * *Positive:* Product matches the intended live assistant experience. Action items and summaries can appear during the meeting instead of after a batch job finishes.
  * *Positive:* Upload-related infrastructure remains useful for importing historical meetings and fallback scenarios.
  * *Negative:* v1 implementation must handle WebSocket auth, reconnects, chunk ordering, stream rate limits, and online diarization complexity earlier.
  * *Negative:* v1 implementation must keep recording import clearly secondary so upload/import UI does not overtake the extension-first capture flow.

---

## ADR 007: Chrome Extension as Primary v1 Capture Surface

* **Date:** 2026-07-04
* **Status:** Accepted
* **Context:** Users already run meetings in Google Meet, Zoom, and Microsoft Teams. A standalone capture page requires behavior change and cannot naturally access meeting-page context. A Chrome extension can meet users inside existing meeting apps, capture tab audio with explicit permission, and sync visible meeting metadata into the MeetingMind console.
* **Decision:** v1 primary capture surface is a Chrome extension, starting with Google Meet. The web app becomes the MeetingMind Console for dashboard, meeting details, action items, decisions, search, settings, imports, and fallback standalone capture. Zoom Web and Teams Web are fast-follow extension targets. Desktop and mobile capture are future integration tracks.
* **Consequences:**
  * *Positive:* Users capture meetings where they already happen, reducing workflow friction.
  * *Positive:* The system can store source app, meeting URL, visible title, and visible participants when available.
  * *Positive:* The backend real-time pipeline remains reusable across extension, standalone web, desktop, mobile, and bot clients.
  * *Negative:* v1 must implement Chrome extension packaging, permissions, tab audio capture, meeting page detection, and extension auth.
  * *Negative:* The extension cannot reliably access private meeting metadata unless it is visible in the page or provided later through official APIs/OAuth.

---

## ADR 008: Local BGE 768-Dimensional Embeddings

* **Date:** 2026-07-04
* **Status:** Accepted
* **Context:** Earlier docs mixed OpenAI-style `vector(1536)`, BGE-M3 1024-dimensional references, and local BGE 768-dimensional references. The default MeetingMind deployment is local-first and should not require external embedding APIs.
* **Decision:** Use a local BAAI BGE 768-dimensional embedding model as the default v1 embedding provider. Transcript segment vectors use `pgvector` column type `vector(768)` with HNSW cosine indexes.
* **Consequences:**
  * *Positive:* The database schema, tests, and AI pipeline align with the privacy-first local inference requirement.
  * *Positive:* Self-hosted deployments avoid OpenAI-sized vector assumptions.
  * *Negative:* Operators who opt into a different embedding provider must run a deliberate migration or maintain a separate vector column/index.
