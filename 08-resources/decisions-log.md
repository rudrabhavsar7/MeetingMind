---
Title: MeetingMind — Resources: Architecture Decision Log
Version: 1.3.0
Status: Approved
Owner: Lead Architect
Last Updated: 2026-07-15
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
* **Decision:** v1 primary ingestion is live meeting capture. The client creates a live meeting session, streams 250-500ms audio chunks, receives interim/final transcript events, and displays rolling AI summaries/action items. Recording import remains supported as a secondary backfill/fallback path using presigned object-storage uploads and Celery batch processing. ADR 011 later resolves the v1 transport as WebSocket and defers WebRTC.
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
* **Decision:** Use a local BAAI BGE 768-dimensional embedding model as the default v1 embedding provider. The embedding column uses `pgvector` type `vector(768)` with HNSW cosine indexes. ADR 012 later places embeddings on dedicated transcript chunks rather than overloading source transcript segments.
* **Consequences:**
  * *Positive:* The database schema, tests, and AI pipeline align with the privacy-first local inference requirement.
  * *Positive:* Self-hosted deployments avoid OpenAI-sized vector assumptions.
  * *Negative:* Operators who opt into a different embedding provider must run a deliberate migration or maintain a separate vector column/index.

---

## ADR 009: Workspace Context in API Paths

* **Date:** 2026-07-08
* **Status:** Accepted
* **Context:** Earlier API requirements mentioned `X-Workspace-ID` as the primary workspace context carrier, while the Jira backlog and backend API specification used explicit workspace paths such as `/api/v1/workspaces/{workspace_id}/meetings`. Header-scoped tenancy creates ambiguity for generated clients and makes endpoint contracts harder for agents to implement consistently.
* **Decision:** Workspace collection routes carry workspace context in the URL path. Meeting child routes such as `/api/v1/meetings/{meeting_id}/transcript` derive workspace context from the meeting record and then enforce membership. `X-Workspace-ID` is not the primary authorization boundary.
* **Consequences:**
  * *Positive:* API routes are self-describing and match the Jira endpoint inventory.
  * *Positive:* Workspace authorization can be tested directly from path/resource ownership instead of relying on a client-provided header.
  * *Negative:* Some non-resource commands may need explicit workspace IDs in either path or body if they are added later.

---

## ADR 010: Single-Workspace v1 Bootstrap with Invitation-Only Membership

* **Date:** 2026-07-10
* **Status:** Accepted
* **Owner:** Product and Architecture
* **Context:** The v1 product documents described one default workspace per self-hosted deployment, while API contracts allowed any authenticated user to create additional workspaces and some design documents treated registration as invitation-only. The role set also drifted between Admin/Member and Owner/Admin/Member/Viewer. This ambiguity affects authentication, database constraints, extension connection, authorization, and onboarding.
* **Alternatives Considered:**
  * Allow open registration where every user creates a workspace. Rejected for v1 because it contradicts the self-hosted single-organization deployment and creates an unintended multi-workspace product.
  * Require an operator to seed the first account through the CLI. Rejected because it makes first-run deployment unnecessarily difficult.
  * Support arbitrary workspace creation and switching in v1. Rejected because the feature matrix schedules the multi-workspace user experience for v1.2.
* **Decision:** A fresh v1 deployment exposes a first-run bootstrap flow only while there are zero users. The bootstrap transaction creates the first user as `owner` and creates the deployment's one default workspace. After bootstrap, public registration closes; subsequent users register only with a valid, single-use, expiring invitation bound to that workspace, email address, and proposed role. The v1 role enum is `owner`, `admin`, `member`, and `viewer`. The data model and workspace-scoped API paths remain multi-tenant-ready, but v1 returns at most one active workspace per user and does not expose arbitrary workspace creation or workspace switching. Additional workspace creation and switching remain v1.2 work.
* **Consequences:**
  * *Positive:* First-run self-hosting remains simple without leaving an open registration surface after initialization.
  * *Positive:* Workspace isolation and the final four-role data model can be implemented once and retained for v1.2.
  * *Positive:* Extension connection has one unambiguous workspace target in v1.
  * *Negative:* Invitation issuance, expiry, revocation, acceptance, and email-delivery behavior become required v1 contracts.
  * *Negative:* Bootstrap must be atomic so concurrent first-run requests cannot create multiple owners or workspaces.

---

## ADR 011: WebSocket v1 Capture Protocol and Manifest V3 Offscreen Ownership

* **Date:** 2026-07-10
* **Status:** Accepted
* **Owner:** Architecture and Extension Engineering
* **Context:** Earlier documents alternated between WebSocket and WebRTC without defining which transport v1 implements. The stream token expired after 15 minutes with no reconnect renewal, Pause/Resume existed only in design, binary audio metadata pairing was ambiguous, and several required events lacked schemas. Manifest V3 service workers also cannot own the DOM/media lifecycle required for durable tab capture.
* **Alternatives Considered:**
  * WebRTC for v1. Deferred because NAT traversal, signaling, TURN operations, and media negotiation add complexity that is not required for one-way self-hosted PCM ingestion.
  * Media ownership in the popup/side panel. Rejected because popup lifetime and navigation are not reliable capture lifecycles.
  * Unacknowledged fire-and-forget WebSocket frames. Rejected because reconnects could silently duplicate or lose transcript audio.
* **Decision:** v1 uses one authenticated WebSocket protocol, version `1.0`, for extension and standalone live audio ingestion. WebRTC is not a v1 transport. The Chrome extension requires Chrome 116+ and uses a service worker to orchestrate capture after an explicit user gesture; a `USER_MEDIA` offscreen document consumes the one-use tab stream ID, preserves local tab playback, resamples audio, owns the WebSocket, and holds the bounded in-memory replay buffer. Audio uses 16 kHz mono signed 16-bit little-endian PCM in self-describing binary frames. The server acknowledges the highest contiguous sequence. Clients retain at most 60 seconds of unacknowledged audio, reconnect with a fresh 15-minute handshake token minted from an eight-hour extension session, and report unrecoverable loss through an `audio_gap` control message. Active WebSockets are not terminated merely because their handshake token expires. v1 live sessions are limited to eight hours. Pause keeps the session/heartbeat alive but sends no audio. The complete contract is `04-backend/realtime-protocol.md`.
* **Consequences:**
  * *Positive:* The capture path has one implementable transport, lifecycle owner, codec, replay strategy, and event registry.
  * *Positive:* Short-lived stream tokens remain useful without breaking meetings longer than 15 minutes.
  * *Positive:* Duplicate/out-of-order audio can be handled idempotently.
  * *Negative:* Chrome versions before 116 are unsupported.
  * *Negative:* The extension must declare `tabCapture` and `offscreen` permissions and carefully manage local audio playback and the offscreen document lifecycle.
  * *Negative:* Gaps longer than the bounded replay window are explicit and cannot be reconstructed.

---

## ADR 012: Canonical Tenant Data and Citation-Preserving AI Outputs

* **Date:** 2026-07-10
* **Status:** Accepted
* **Owner:** Backend and AI Architecture
* **Context:** The API contracts contained workspace IDs, creator/timeline fields, due dates, statuses, source segment IDs, and citations that were absent from the database specification. A single mutable `Meeting.summary` string could not preserve rolling/final versions or citations. Embedding arbitrary chunks in `TranscriptSegment.embedding` also conflicted with chunking multiple segments together.
* **Alternatives Considered:**
  * Keep all derived fields on `Meeting` and `TranscriptSegment`. Rejected because it loses output history, model/prompt lineage, and the distinction between verbatim source segments and retrieval chunks.
  * Store raw model JSON only. Rejected because critical relationships and workspace isolation would not be enforceable through relational constraints.
  * Use a fully polymorphic output table for every AI artifact. Rejected for v1 because it weakens domain constraints and makes common action/decision queries harder.
* **Decision:** `04-backend/data-dictionary.md` is the canonical persistence contract. Every tenant-scoped table carries `workspace_id` directly. Verbatim `TranscriptSegment` rows remain immutable except speaker-name mapping/correction metadata. Retrieval uses a separate `TranscriptChunk` table with local BGE `vector(768)`, content/model versioning, and segment boundaries. Summaries are immutable `SummaryVersion` records; one version may be designated current. Actions and decisions remain domain tables. `AIProcessingRun` records provider/model/prompt/input lineage. `AIOutputCitation` links summary versions, actions, and decisions to exact transcript segments, with a constraint that each citation belongs to exactly one output. Raw media is stored as private object keys, never durable public/presigned URLs. API responses may expose a convenient current summary object, but a plain uncited mutable summary string is not canonical storage.
* **Consequences:**
  * *Positive:* Every persisted AI claim can be traced to source segments and the generating model/prompt run.
  * *Positive:* Reprocessing is append/version based and does not silently destroy earlier output.
  * *Positive:* Workspace filtering and future RLS policies can apply directly to every tenant table, including vectors.
  * *Negative:* More tables and foreign keys are required than the original simplified schema.
  * *Negative:* Services must validate that cited segments, outputs, meetings, and runs belong to the same workspace/meeting.
  * *Negative:* Existing scaffold migrations/models need follow-up implementation work; this documentation sync does not modify application code.

---

## ADR 013: Operator-Controlled Docker Compose as the Normative v1 Deployment

* **Date:** 2026-07-11
* **Status:** Accepted
* **Owner:** Architecture and DevOps
* **Context:** Product requirements promise privacy-first self-hosting and local AI by default, but several DevOps documents described Vercel, AWS ECS/RDS/S3, external AI APIs, and hosted telemetry as the production baseline. The repository also claimed that Compose and Helm artifacts already existed when they did not. This made the minimum deployable product, its egress behavior, and its operator responsibilities ambiguous.
* **Alternatives Considered:**
  * Make a managed AWS/Vercel deployment the v1 reference architecture. Rejected because it contradicts the default operator-controlled privacy boundary.
  * Require Kubernetes for v1. Rejected because it increases installation and operations complexity before the single-node product is proven.
  * Allow external AI and telemetry services by default. Rejected because meeting content and metadata could leave operator infrastructure without a deliberate decision.
* **Decision:** The normative v1 production target is one operator-controlled Linux host running Docker Compose. The target stack contains Nginx, Next.js, FastAPI, Celery worker processes, PostgreSQL 16 with pgvector, Redis, MinIO, Ollama, and local transcription/diarization components. The default configuration requires no external AI, telemetry, email, or cloud-storage credentials and sends no meeting content outside operator-controlled infrastructure. TLS certificates, encrypted backups, host hardening, capacity, DNS, and outbound-network policy are operator responsibilities documented by the deployment guide. External cloud infrastructure, model providers, notification services, and telemetry are optional adapters that require explicit operator configuration and must never silently receive meeting content. Kubernetes/Helm is a future scaling path, not a currently shipped artifact. Until Dockerfiles and Compose manifests exist in the repository, documentation must describe them as target artifacts rather than runnable files.
* **Consequences:**
  * *Positive:* Product, security, deployment, and secrets documentation share one concrete default privacy boundary.
  * *Positive:* A v1 installation can operate without third-party service accounts or API keys.
  * *Positive:* Documentation no longer promises deployment artifacts that are absent from the repository.
  * *Negative:* Single-host failure and operator-managed backups/TLS are explicit v1 operational risks.
  * *Negative:* High availability, multi-node GPU scheduling, and managed-cloud conveniences require later deployment profiles.
  * *Negative:* Optional external integrations require egress review, disclosure, and separate secret management.

---

## ADR 014: Supabase PostgreSQL for Shared Development and Staging

* **Date:** 2026-07-11
* **Status:** Accepted
* **Owner:** Engineering and DevOps
* **Context:** Developers need a consistent shared PostgreSQL environment and staging database without each team member maintaining divergent local database state. Supabase is already connected as project-scoped engineering tooling, but MeetingMind must not accidentally adopt Supabase Auth, Storage, Realtime, Edge Functions, or other services, and the production database decision is not yet made.
* **Alternatives Considered:**
  * Require every developer to use only a local PostgreSQL container. Rejected for the current team workflow because schema/data drift makes shared integration work harder.
  * Adopt the complete Supabase platform. Rejected because MeetingMind already owns authentication, storage, real-time transport, functions/jobs, and privacy boundaries.
  * Decide the production database now. Deferred explicitly; development/staging convenience does not determine the production architecture.
* **Decision:** Development and staging use only the managed PostgreSQL service (including pgvector) in the configured Supabase project. Supabase Auth, Storage, Realtime, Edge Functions, and application SDK coupling are out of scope. The shared project uses isolated `meetingmind_dev` and `meetingmind_staging` schemas with separate least-privilege application credentials; both schemas include the shared `extensions` schema in `search_path` for pgvector. CI continues to use disposable local PostgreSQL. Only synthetic, generated, or explicitly approved non-production meeting data may be stored in Supabase. All schema changes are authored as reviewed Alembic migrations; developers must not make untracked dashboard/MCP DDL changes. Staging receives migrations only through the controlled promotion workflow. Production PostgreSQL hosting remains unresolved and ADR 013 continues to define the current production target until a later explicit decision supersedes it.
* **Consequences:**
  * *Positive:* The team shares consistent PostgreSQL/pgvector behavior for development and staging.
  * *Positive:* Application code remains portable SQLAlchemy/PostgreSQL code without Supabase-specific auth/storage/runtime dependencies.
  * *Positive:* The production decision remains independent and reversible.
  * *Negative:* Development/staging database traffic and approved test data leave local machines and are subject to Supabase availability, access control, and retention.
  * *Negative:* Schema/credential isolation and migration ownership are required to prevent developers or staging from interfering with one another.
  * *Negative:* Supabase dashboard/MCP access is privileged engineering access and must be least-privilege, audited, and never embedded in client code.

---

## ADR 015: Dependency-Gated Phases with Two-Week Sprints

* **Date:** 2026-07-15
* **Status:** Accepted
* **Owner:** Project Management and Engineering
* **Context:** The Jira backlog grouped work by technical epic and provided assignees, points, and dependencies, while the README described it as a sprint plan. No document assigned tickets to sprints, defined phase gates, or controlled when parallel frontend, backend, extension, AI, database, and DevOps work could integrate. This created a risk that mock UI, unstable APIs, incomplete schemas, or release infrastructure would be treated as completed features.
* **Alternatives Considered:**
  * Use only the existing Jira epic grouping. Rejected because epics describe feature ownership but do not provide delivery gates or iteration capacity.
  * Use only time-boxed sprints. Rejected because sprint dates alone do not prevent dependent features from starting against unstable contracts.
  * Create one long-lived branch per phase. Rejected because it delays integration and increases merge conflicts across shared files.
* **Decision:** MeetingMind v1 uses the hierarchy Release -> Phase -> two-week Sprint -> Jira Ticket -> Implementation Subtask. `02-engineering/phase-plan.md` is the scheduling source of truth. Jira remains authoritative for ticket scope, assignee, points, and acceptance criteria. Later phases start only when their named entry dependencies are green. API/event contracts are approved before parallel producer/consumer implementation, one accountable owner coordinates each shared surface, and phases close only with integrated persisted-data evidence. Work uses ticket branches and small pull requests rather than long-lived phase branches.
* **Consequences:**
  * *Positive:* Cross-team work can proceed in parallel without treating mocks or partial infrastructure as integrated features.
  * *Positive:* Sprint capacity and phase dependency gates are visible independently.
  * *Positive:* Jira ticket history and acceptance criteria remain stable while schedules can be replanned.
  * *Negative:* Sprint planning must maintain phase status, handoff evidence, and dependency readiness.
  * *Negative:* Oversized cross-phase tickets such as MM-104 require explicit subtasks and do not earn points until the parent acceptance criteria pass.
