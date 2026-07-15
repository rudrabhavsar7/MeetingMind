---
Title: MeetingMind - Canonical Data Dictionary
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-10
Dependencies: 08-resources/decisions-log.md
Related Documents:
  - 04-backend/database-schema.md
  - 04-backend/er-diagram.md
  - 02-engineering/jira-api-contracts.md
  - 04-backend/realtime-protocol.md
---

# MeetingMind Canonical Data Dictionary

## 1. Authority and Conventions

This document is the canonical persistence contract. API examples may omit internal fields but must not contradict their types or meaning.

- Public and primary identifiers are UUIDs.
- All timestamps are timezone-aware UTC.
- Every tenant-scoped table carries `workspace_id` directly, even when it can be derived through a meeting, so isolation, indexes, and future RLS are explicit.
- Foreign keys use `ON DELETE RESTRICT` for audit/security roots and `ON DELETE CASCADE` for meeting-owned derived data after the soft-delete retention window.
- Raw opaque tokens are never stored; only cryptographic token hashes are persisted.
- Presigned URLs are response-time credentials and are never database fields.
- User-visible AI output is append/version based. Regeneration must not overwrite historical source/citation lineage.

All mutable tables include `created_at` and `updated_at` unless stated otherwise. Valuable roots use nullable `deleted_at` for soft deletion.

## 2. Identity and Workspace

### `users`

`id`, unique normalized `email`, `full_name`, nullable `avatar_object_key`, `password_hash`, `is_active`, `created_at`, `updated_at`, nullable `deleted_at`.

### `workspaces`

`id`, unique `slug`, `name`, `is_default`, `settings` JSONB, nullable `raw_audio_retention_days`, timestamps, nullable `deleted_at`.

v1 permits one active workspace with `is_default=true`. Additional workspace creation is deferred to v1.2.

### `workspace_memberships`

`id`, `workspace_id`, `user_id`, `role` (`owner|admin|member|viewer`), timestamps. Unique `(workspace_id, user_id)`. The last active Owner is protected by service/transaction rules.

### `workspace_invitations`

`id`, `workspace_id`, normalized `email`, proposed `role` (`admin|member|viewer`), unique `token_hash`, `invited_by_user_id`, `expires_at`, nullable `accepted_at`, nullable `revoked_at`, timestamps. At most one pending invitation per workspace/email.

### `refresh_tokens`

`id`, `user_id`, unique `token_hash`, `expires_at`, nullable `revoked_at`, nullable self-FK `replaced_by_token_id`, timestamps.

### `password_reset_tokens`

`id`, `user_id`, unique `token_hash`, `expires_at`, nullable `used_at`, nullable `revoked_at`, timestamps.

### `extension_sessions`

`id`, `workspace_id`, `user_id`, `device_id`, unique `token_hash`, `extension_version`, `browser`, `expires_at`, nullable `last_heartbeat_at`, nullable `revoked_at`, timestamps. Unique active `(user_id, device_id)` where practical. Content scripts never receive this token.

## 3. Meetings and Media

### `meetings`

Required fields:

- `id`, `workspace_id`, `created_by_user_id`;
- `title`, nullable `source_title`, `source_type` (`extension_capture|standalone_web_capture|recording_import`), `source_app` (`google_meet|zoom_web|teams_web|standalone_web|import`), nullable `source_url`;
- `status` (`scheduled|recording|paused|transcribing|analyzing|completed|failed`);
- `started_at`, nullable `ended_at`, nullable `duration_seconds`;
- `raw_audio_retained`, nullable `last_error_code`, nullable safe `last_error_message`;
- `current_summary_version_id` (nullable FK assigned after summary row exists);
- timestamps and nullable `deleted_at`.

`detected`, `connecting`, and similar extension states are client/session states, not durable meeting statuses.

### `meeting_participants`

`id`, `workspace_id`, `meeting_id`, nullable `source_participant_id`, `display_name`, nullable `user_id`, `first_seen_at`, `last_seen_at`, `metadata` JSONB. Unique source participant ID within a meeting where present. Visible DOM names are untrusted strings.

### `media_objects`

`id`, `workspace_id`, `meeting_id`, `kind` (`import|live_audio|extracted_audio|export|avatar`), private `object_key`, `content_type`, `size_bytes`, nullable `checksum_sha256`, `retention_until`, `status`, timestamps, nullable `deleted_at`.

The database never stores public URLs or presigned URLs. Extracted working audio is deleted after successful processing according to the lifecycle policy.

## 4. Transcript Source of Truth

### `transcript_segments`

`id`, `workspace_id`, `meeting_id`, `client_instance_id`, `sequence_number`, `speaker_label`, nullable `speaker_name`, `start_time`, `end_time`, `text`, `is_final`, nullable `stt_confidence`, nullable `language`, nullable `supersedes_segment_id`, timestamps.

Constraints and rules:

- Unique `(meeting_id, client_instance_id, sequence_number)` for final source input/deduplication.
- `start_time >= 0`, `end_time > start_time`.
- Interim events may be ephemeral; only final segments are required to persist.
- Final text/timing is immutable. Corrections create a superseding record or explicit correction audit; speaker display mapping may change without rewriting source text.

### `transcript_chunks`

`id`, `workspace_id`, `meeting_id`, `first_segment_id`, `last_segment_id`, `text`, `start_time`, `end_time`, `content_hash`, `chunker_version`, `embedding_model`, `embedding_dimensions` (must be 768 for default v1), nullable `embedding vector(768)`, timestamps.

Unique `(meeting_id, content_hash, chunker_version, embedding_model)`. HNSW cosine index applies to `embedding`; B-tree indexes include `(workspace_id, meeting_id)` and `(meeting_id, start_time)`. Re-embedding writes/upserts a versioned chunk and never changes transcript source rows.

## 5. AI Processing and Outputs

### `ai_processing_runs`

`id`, `workspace_id`, `meeting_id`, `stage` (`summary|action_items|decisions|embedding|rag`), `mode` (`rolling|final|batch|backfill`), `provider`, `model`, `prompt_version`, nullable `input_first_segment_id`, nullable `input_last_segment_id`, `input_hash`, `status` (`queued|running|completed|failed`), nullable `error_code`, `started_at`, nullable `completed_at`, timestamps.

The run stores identifiers and hashes, not a second uncensored transcript copy.

### `summary_versions`

`id`, `workspace_id`, `meeting_id`, `ai_processing_run_id`, monotonically increasing `version`, `kind` (`rolling|final|user_edited`), `executive_summary`, `key_points` JSONB array of strings, `status` (`draft|current|superseded`), nullable `edited_by_user_id`, timestamps.

Unique `(meeting_id, version)`. Only one version per meeting may have `status=current`. A user edit creates a new version and retains citations/lineage.

### `action_items`

`id`, `workspace_id`, `meeting_id`, nullable `ai_processing_run_id`, `text`, nullable `assignee_user_id`, nullable `assignee_name`, nullable `due_date`, `status` (`open|completed`), `origin` (`ai|user`), nullable `confidence_score`, nullable `completed_at`, nullable `updated_by_user_id`, timestamps, nullable `deleted_at`.

### `decisions`

`id`, `workspace_id`, `meeting_id`, nullable `ai_processing_run_id`, `title`, `text`, nullable `rationale`, `origin` (`ai|user`), nullable `confidence_score`, nullable `updated_by_user_id`, timestamps, nullable `deleted_at`.

### `ai_output_citations`

`id`, `workspace_id`, `meeting_id`, `transcript_segment_id`, nullable `summary_version_id`, nullable `action_item_id`, nullable `decision_id`, `start_time`, `end_time`, nullable `text_excerpt`, timestamps.

A database CHECK requires exactly one of `summary_version_id`, `action_item_id`, or `decision_id`. Service validation requires cited segment/output/run to share the same workspace and meeting. AI-origin summaries, actions, and decisions require at least one citation before becoming current/user-visible; uncited candidates remain draft/rejected.

### `ai_output_feedback`

`id`, `workspace_id`, `meeting_id`, `user_id`, nullable `summary_version_id`, nullable `action_item_id`, nullable `decision_id`, `rating` (`up|down`), nullable `comment`, `created_at`.

A CHECK requires exactly one output foreign key. Unique `(user_id, output_type, output_id)` prevents duplicate active ratings; a later rating replaces the user's prior rating through an audited upsert. Feedback is local product data and is never automatically sent to an external provider.

## 6. Audit and Operations

### `audit_logs`

Append-only: `id`, `workspace_id` nullable only for pre-workspace bootstrap events, nullable `actor_user_id`, `action`, `resource_type`, nullable `resource_id`, `request_id`, nullable `ip_address`, safe `metadata` JSONB, `created_at`. Never store passwords, raw tokens, audio, transcript text, or AI prompt context.

### Required Indexes

- Every tenant table: leading `workspace_id` index.
- Meetings: `(workspace_id, created_at DESC)`, `(workspace_id, status)`.
- Transcript: `(workspace_id, meeting_id, start_time)`, unique stream sequence key.
- Outputs: `(workspace_id, meeting_id, created_at)` and current-summary partial unique index.
- Citations: indexes on each output FK and transcript segment FK.
- Feedback: indexes on workspace/meeting and each output FK.
- Tokens: unique token hashes plus expiry/revocation indexes.

## 7. Invariants Required in Tests

- Cross-workspace foreign-key combinations are rejected by service checks and, where practical, composite database constraints.
- Soft-deleted meetings and all child content are excluded from normal reads/vector retrieval.
- Replayed audio and repeated AI jobs are idempotent.
- Every current AI-origin summary/action/decision has at least one valid source citation.
- Regeneration creates new output/run versions; it does not silently overwrite prior output.
- Vector search always filters by `workspace_id` before distance ordering.
- Durable storage contains object keys only; signed URLs expire and never appear in persisted fields/logs.
