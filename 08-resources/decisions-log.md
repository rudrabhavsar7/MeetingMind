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
* **Status:** Accepted
* **Context:** Users upload 2GB video files. Routing this traffic through the FastAPI server causes massive memory spikes and blocks async workers.
* **Decision:** The frontend will request an S3 Presigned URL from FastAPI, and then upload the file directly to S3 via a `PUT` request.
* **Consequences:**
  * *Positive:* FastAPI server remains highly responsive. Saves 50% on AWS ingress bandwidth costs.
  * *Negative:* Adds complexity to the upload flow (Frontend -> API -> S3 -> Frontend -> API). Requires strict CORS configuration on the S3 bucket.
