---
Title: MeetingMind — Backend: Database Schema
Version: 1.2.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-10
Dependencies: 04-backend/er-diagram.md
---

# MeetingMind Backend: Database Schema

## 1. Overview
The database schema defines the aggregate structure for persistent MeetingMind data. `04-backend/data-dictionary.md` is normative for field types, enums, constraints, provenance, and indexes. PostgreSQL is the primary relational store and pgvector stores local transcript-chunk embeddings.

## 2. Technology Stack
* **Database:** PostgreSQL 16+
* **Vector Extension:** `pgvector`
* **ORM:** SQLAlchemy 2 async.
* **Migrations:** Alembic.

## 3. Core Entities

### 3.1. Workspaces
Multi-tenancy is handled at the Workspace level. Every entity must belong to a Workspace.
* `id` (UUID, Primary Key)
* `name` (String)
* `slug` (String, Unique)
* `is_default` (Boolean) - `true` for the one workspace exposed by v1.
* `created_at` (Timestamp)
* `updated_at` (Timestamp)
* `settings` (JSONB) - Storage for workspace-wide preferences.

### 3.2. Users & Memberships
The schema supports users belonging to multiple workspaces with different roles for forward compatibility. Per ADR 010, v1 exposes only the deployment's default workspace; additional memberships/workspaces become user-facing in v1.2.
* **Users Table:**
  * `id` (UUID, Primary Key)
  * `email` (String, Unique)
  * `name` (String)
  * `avatar_object_key` (String, nullable; private object key, never a durable signed/public URL)
  * `password_hash` (String, Nullable if OAuth)
* **WorkspaceMemberships Table (Join Table):**
  * `workspace_id` (UUID, Foreign Key)
  * `user_id` (UUID, Foreign Key)
  * `role` (Enum: 'owner', 'admin', 'member', 'viewer')
  * *Primary Key:* (workspace_id, user_id)

### 3.2.1. Workspace Invitations
Pending invitations are separate from memberships; a user gains access only after successful registration/acceptance.
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key)
* `email` (String, normalized lowercase)
* `role` (Enum: 'admin', 'member', 'viewer')
* `token_hash` (String, Unique) - Never store the raw invitation token.
* `invited_by_user_id` (UUID, Foreign Key)
* `expires_at` (Timestamp)
* `accepted_at` (Timestamp, Nullable)
* `revoked_at` (Timestamp, Nullable)
* `created_at` (Timestamp)

Enforce at most one active invitation per `(workspace_id, email)`. Invitation acceptance must create the user/membership and consume the invitation in one transaction.

### 3.2.2. Password Reset Tokens
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key)
* `token_hash` (String, Unique)
* `expires_at` (Timestamp)
* `used_at` (Timestamp, Nullable)
* `revoked_at` (Timestamp, Nullable)
* `created_at` (Timestamp)

Only token hashes are stored. A successful password reset consumes the token and revokes all active refresh tokens for the user.

### 3.2.3. Refresh Tokens
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key)
* `token_hash` (String, Unique)
* `expires_at` (Timestamp)
* `revoked_at` (Timestamp, Nullable)
* `replaced_by_token_id` (UUID, Self Foreign Key, Nullable)
* `created_at` (Timestamp)

Refresh tokens rotate on login/refresh. Reuse of a replaced or revoked token fails and should revoke the affected token family where supported.

### 3.2.4. Extension Sessions
Revocable eight-hour extension sessions carry `workspace_id`, `user_id`, `device_id`, hashed token, version/browser metadata, expiry, heartbeat, and revocation timestamps. They never belong to content-script context.

### 3.3. Meetings
The aggregate root for extension, standalone, or imported capture. It directly carries workspace/creator IDs, source metadata, durable processing status, started/ended timestamps, duration, retention/error state, and a nullable pointer to the current `SummaryVersion`. Client states such as `connecting` are not durable meeting statuses. `bot_join` is deferred and is not a v1 enum value.

Participants are normalized into `MeetingParticipant` rows. Media is represented by private `MediaObject.object_key` rows; durable `media_url` or presigned URL columns are forbidden.

### 3.4. Transcripts (Segments)
Verbatim source text is stored as final, timestamped `TranscriptSegment` rows with direct workspace/meeting IDs, client instance and sequence for replay deduplication, speaker label/name, timing, text, and optional STT confidence/language. Final source rows are immutable except through explicit superseding correction metadata.

Retrieval text and vectors live in separate `TranscriptChunk` rows. A chunk references its first/last source segments, content hash, chunker/model versions, timing, text, and `vector(768)` embedding. This avoids pretending that one transcript segment always equals one retrieval chunk.

### 3.5. Action Items
Action items directly carry workspace/meeting IDs, optional processing-run ID, text, optional user/name assignment, due date, `open|completed` status, origin, confidence, completion and user-edit audit fields. AI-origin actions require at least one `AIOutputCitation` before becoming visible.

### 3.6. Decisions
Decisions directly carry workspace/meeting IDs, optional processing-run ID, title, decision text, rationale, origin, confidence, and edit audit fields. AI-origin decisions require citations.

### 3.7. Versioned AI Outputs and Provenance
* `AIProcessingRun` stores stage/mode, local provider/model, prompt version, input segment range/hash, status, and safe failure metadata.
* `SummaryVersion` stores immutable rolling/final/user-edited versions. Only one version is current per meeting.
* `AIOutputCitation` connects exactly one SummaryVersion, ActionItem, or Decision to an exact TranscriptSegment and timestamp range.
* Regeneration appends a run/output version and never silently overwrites prior output or citations.

### 3.8. Audit Log
Security-sensitive activity is appended to `AuditLog`. It stores actor/resource/request identifiers and safe metadata, never raw tokens, meeting content, or prompts.

## 4. Vector Search Configuration
To enable fast similarity search on retrieval chunks:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE transcript_chunks ADD COLUMN embedding vector(768);

-- Create an HNSW index for fast approximate nearest neighbor search
CREATE INDEX ix_transcript_chunks_embedding_hnsw
ON transcript_chunks USING hnsw (embedding vector_cosine_ops);
```

## 5. Relationships
* **Workspace** `1:M` **Users** (via Memberships)
* **Workspace** `1:M` **Meetings**
* **Meeting** `1:M` **Participants** and **Media Objects**
* **Meeting** `1:M` **Transcript Segments**
* **Meeting** `1:M` **Transcript Chunks** and **AI Processing Runs**
* **Meeting** `1:M` **Summary Versions**
* **Meeting** `1:M` **Action Items**
* **Meeting** `1:M` **Decisions**
* **Transcript Segment** `1:M` **AI Output Citations**

## 6. Multi-Tenancy Strategy
* **v1 Product Boundary:** The deployment exposes one active default workspace. The first-run bootstrap transaction creates it with the first Owner. Additional workspace creation and switching are deferred to v1.2 per ADR 010.
* **Forward-Compatible Schema:** Keep workspace foreign keys and workspace-scoped roles in v1 so the isolation boundary does not need to be redesigned for v1.2.
* Every tenant-scoped table carries `workspace_id` directly. All ORM queries filter it, including vector retrieval and background jobs.
* Row-Level Security (RLS) remains a defense-in-depth v1.2 target; API/service membership checks are mandatory in v1.
* Never expose internal sequential integer IDs; use UUIDv4 (or UUIDv7 for sortability) for all primary keys to prevent ID enumeration attacks.

## 7. JSONB Usage
PostgreSQL's `JSONB` type should be used sparingly, primarily for unstructured metadata that doesn't require strict relational querying.
* Raw model output is not a substitute for relational output/citation fields. Safe provider metadata belongs on `AIProcessingRun`.

## 8. Soft Deletes
Valuable roots use nullable `deleted_at`. Normal reads, background jobs, and vector retrieval exclude soft-deleted roots. Hard deletion cascades meeting-owned data only after the documented retention window.

## 9. Performance Indexes
Beyond Foreign Keys and Vectors, ensure indexes on:
* `Meetings(workspace_id, created_at)` - For dashboard chronological sorting.
* `TranscriptSegments(workspace_id, meeting_id, start_time)` - For chronological transcript retrieval.
* Unique `TranscriptSegments(meeting_id, client_instance_id, sequence_number)` - For replay deduplication.
* `TranscriptChunks(workspace_id, meeting_id)` plus HNSW cosine index.
* `AIOutputCitations` indexes for transcript segment and each output foreign key.
* `WorkspaceInvitations(workspace_id, email)` with a partial uniqueness rule for pending invitations.
* Unique indexes on invitation and password-reset `token_hash` values.

## 10. Future Scalability
* If transcript chunks become massive, consider partitioning by workspace/date. Any move from pgvector requires a future ADR and must preserve workspace filtering and citation identifiers.
