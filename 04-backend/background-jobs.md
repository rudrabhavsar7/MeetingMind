---
Title: MeetingMind — Backend: Background Jobs
Version: 1.1.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-11
Dependencies: 04-backend/ai-pipeline.md, 05-devops/infrastructure.md
---

# MeetingMind Backend: Background Jobs

## 1. Overview
Beyond the core real-time AI Meeting Processing Pipeline, v1 requires asynchronous jobs for imported recordings, finalization, embeddings, retention, and operational cleanup. This document separates committed v1 jobs from later integrations so implementations do not accidentally add egress or nonexistent billing features.

## 2. Technology Stack
* **Job Scheduler:** Celery Beat (integrated with the existing Celery worker pool).
* **State Store:** Redis (for Celery Beat schedule and distributed locks).

## 3. v1 Scheduled Jobs

### 3.1 Data Retention & Cleanup
* **Schedule:** Daily at 04:00 AM UTC.
* **Function:** `tasks.cleanup_soft_deleted_records`
* **Description:** Finds records whose configured retention/grace periods have expired, deletes associated objects through the configured MinIO/S3-compatible adapter, then hard-deletes eligible database rows in an idempotent transaction workflow. Workspace deletion must not rely on a hard-coded 30-day policy, and failures must be retryable without orphaning cross-workspace objects.

### 3.2 Operational Reconciliation
* **Schedule:** Operator-configurable, at least daily.
* **Function:** `tasks.reconcile_processing_state`
* **Description:** Detects stale processing runs, abandoned multipart uploads, missing object references, and meetings stuck past their heartbeat/finalization window. It records auditable failures and retries only idempotent work.

## 4. v1 Event-Driven Background Jobs

These are triggered by imports or meeting finalization and include media normalization, batch transcription/diarization, transcript chunking/embedding, cited AI-output generation, and temporary-file cleanup. Each task accepts identifiers rather than transcript bodies, reloads workspace-scoped data, records an `AIProcessingRun` where applicable, and is idempotent.

## 5. Deferred/Optional Jobs

Weekly proactive insights, billing aggregation, calendar polling/bots, welcome email, outbound webhooks, and Slack delivery are not baseline v1 jobs. They require product tickets, persistence/API contracts, consent and authorization rules, retry/dead-letter behavior, and explicit external-egress configuration before implementation.

## 6. Concurrency & Locking
* **Problem:** If cleanup or reconciliation runs longer than its interval, another instance could overlap and cause duplicate processing or conflicting deletion work.
* **Solution:** Implement Distributed Locks using Redis (e.g., `redis-py` lock).
```python
@celery.task(bind=True)
def cleanup_expired_data(self):
    lock_id = "lock:cleanup_expired_data"
    # Acquire lock with a timeout of 12 hours
    if redis_client.set(lock_id, "locked", nx=True, ex=43200):
        try:
            # Perform idempotent retention cleanup...
            pass
        finally:
            redis_client.delete(lock_id)
    else:
        logger.info("Task already running, skipping...")
```

## 7. Error Monitoring
* Task failures emit sanitized structured logs and local Prometheus metrics; meeting content is never logged.
* Hosted error tracking is optional, disabled by default, and may receive only redacted operational metadata after explicit operator configuration.
* Celery Beat liveness and last-success timestamps are monitored locally so scheduled tasks cannot silently stop.
