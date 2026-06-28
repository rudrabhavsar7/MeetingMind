---
Title: MeetingMind — Backend: Database Schema
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/er-diagram.md
---

# MeetingMind Backend: Database Schema

## 1. Overview
The database schema defines the structure for all persistent data in MeetingMind. It utilizes PostgreSQL as the primary relational store, combined with `pgvector` for storing LLM embeddings to enable semantic search (RAG).

## 2. Technology Stack
* **Database:** PostgreSQL 16+
* **Vector Extension:** `pgvector`
* **ORM:** SQLAlchemy (Async) or SQLModel in Python (FastAPI).
* **Migrations:** Alembic.

## 3. Core Entities

### 3.1. Workspaces
Multi-tenancy is handled at the Workspace level. Every entity must belong to a Workspace.
* `id` (UUID, Primary Key)
* `name` (String)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)
* `settings` (JSONB) - Storage for workspace-wide preferences.

### 3.2. Users & Memberships
Users can belong to multiple workspaces with different roles.
* **Users Table:**
  * `id` (UUID, Primary Key)
  * `email` (String, Unique)
  * `name` (String)
  * `avatar_url` (String)
  * `password_hash` (String, Nullable if OAuth)
* **WorkspaceMemberships Table (Join Table):**
  * `workspace_id` (UUID, Foreign Key)
  * `user_id` (UUID, Foreign Key)
  * `role` (Enum: 'admin', 'member', 'viewer')
  * *Primary Key:* (workspace_id, user_id)

### 3.3. Meetings
The central entity. Represents a recorded or uploaded session.
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key)
* `title` (String)
* `date` (Timestamp)
* `duration_seconds` (Integer)
* `status` (Enum: 'uploading', 'processing', 'completed', 'failed')
* `source_type` (Enum: 'upload', 'live_record', 'bot_join')
* `media_url` (String) - Pointer to S3/Blob storage.
* `summary` (Text) - Cached AI summary.
* `created_at` (Timestamp)

### 3.4. Transcripts (Segments)
We do not store the transcript as one massive string. It is broken into segments for diarization and vectorization.
* `id` (UUID, Primary Key)
* `meeting_id` (UUID, Foreign Key)
* `speaker_name` (String)
* `start_time` (Float) - Seconds from beginning.
* `end_time` (Float) - Seconds from beginning.
* `text` (Text)
* `embedding` (Vector) - Uses `pgvector` (e.g., `vector(1536)` for OpenAI text-embedding-3-small).

### 3.5. Action Items
Tasks extracted by the AI.
* `id` (UUID, Primary Key)
* `meeting_id` (UUID, Foreign Key)
* `description` (Text)
* `assignee_name` (String, Nullable)
* `is_completed` (Boolean)
* `citation_timestamp` (Float, Nullable) - Links back to the transcript.

### 3.6. Decisions
Core agreements extracted by the AI.
* `id` (UUID, Primary Key)
* `meeting_id` (UUID, Foreign Key)
* `title` (String)
* `rationale` (Text)

## 4. Vector Search Configuration
To enable fast similarity search on the transcript segments:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Assume table is transcript_segments
ALTER TABLE transcript_segments ADD COLUMN embedding vector(1536);

-- Create an HNSW index for fast approximate nearest neighbor search
CREATE INDEX ON transcript_segments USING hnsw (embedding vector_cosine_ops);
```

## 5. Relationships
* **Workspace** `1:M` **Users** (via Memberships)
* **Workspace** `1:M` **Meetings**
* **Meeting** `1:M` **Transcript Segments**
* **Meeting** `1:M` **Action Items**
* **Meeting** `1:M` **Decisions**

## 6. Multi-Tenancy Strategy
* Row-Level Security (RLS) is highly recommended at the PostgreSQL level.
* Alternatively, ensure *every* database query in the ORM includes a `.where(Meeting.workspace_id == current_user.workspace_id)` clause.
* Never expose internal sequential integer IDs; use UUIDv4 (or UUIDv7 for sortability) for all primary keys to prevent ID enumeration attacks.

## 7. JSONB Usage
PostgreSQL's `JSONB` type should be used sparingly, primarily for unstructured metadata that doesn't require strict relational querying.
* e.g., A meeting might have an `ai_metadata` JSONB column storing raw LLM output or token usage stats.

## 8. Soft Deletes
Critical tables (Meetings, Workspaces) should implement soft deletes (an `is_deleted` boolean or `deleted_at` timestamp) to allow for data recovery, as meeting audio and transcripts are highly valuable.

## 9. Performance Indexes
Beyond Foreign Keys and Vectors, ensure indexes on:
* `Meetings(workspace_id, created_at)` - For dashboard chronological sorting.
* `TranscriptSegments(meeting_id, start_time)` - To ensure fast retrieval of a meeting's transcript in chronological order.

## 10. Future Scalability
* If `TranscriptSegments` becomes massive (billions of rows), consider partitioning the table by date or workspace, or utilizing a dedicated vector database (like Pinecone/Milvus) instead of `pgvector`, though `pgvector` scales very well up to ~10-50M rows with proper HNSW indexes.
