---
Title: MeetingMind — Backend: Background Jobs
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/ai-pipeline.md
---

# MeetingMind Backend: Background Jobs

## 1. Overview
Beyond the core AI Meeting Processing Pipeline (triggered by a user upload), MeetingMind requires several scheduled and asynchronous background jobs to maintain system health, generate proactive insights, and handle integrations.

## 2. Technology Stack
* **Job Scheduler:** Celery Beat (integrated with the existing Celery worker pool).
* **State Store:** Redis (for Celery Beat schedule and distributed locks).

## 3. Scheduled Jobs (Cron)

### 3.1 Weekly Proactive Insights Generation
* **Schedule:** Every Sunday at 02:00 AM UTC.
* **Function:** `tasks.generate_weekly_insights`
* **Description:** Iterates over all active workspaces. For each workspace, retrieves summaries of all meetings from the past 7 days. Prompts the LLM to identify cross-meeting trends, blockers, or recurring topics. Saves the result to a `WorkspaceInsights` table to be displayed on the user's dashboard Monday morning.

### 3.2 Data Retention & Cleanup (Soft Deletion)
* **Schedule:** Daily at 04:00 AM UTC.
* **Function:** `tasks.cleanup_soft_deleted_records`
* **Description:** Scans the database for records (Meetings, Workspaces) marked as `is_deleted = True` where the deletion timestamp is older than 30 days. Permanently `DELETE`s these rows from PostgreSQL. Issues API calls to AWS S3 to permanently delete the associated media files.

### 3.3 Analytics Aggregation
* **Schedule:** Daily at 01:00 AM UTC.
* **Function:** `tasks.aggregate_daily_usage`
* **Description:** Calculates total audio minutes processed per workspace for billing and telemetry purposes. Updates the `WorkspaceBillingStats` table.

### 3.4 Calendar Sync (Integration)
* **Schedule:** Every 15 minutes.
* **Function:** `tasks.sync_upcoming_meetings`
* **Description:** For users who have linked Google Calendar or Microsoft Outlook, polls their API for upcoming meetings to automatically schedule the MeetingMind Bot to join.

## 4. Event-Driven Background Jobs

These aren't scheduled, but are triggered by specific application events outside the main AI pipeline.

### 4.1 Welcome Email / Onboarding Sequence
* **Trigger:** User Registration.
* **Function:** `tasks.send_welcome_email`
* **Description:** Dispatches an email via SendGrid/Postmark. Offloaded to Celery so the API returns `200 OK` instantly on signup.

### 4.2 Webhook Dispatching
* **Trigger:** Meeting Pipeline Complete.
* **Function:** `tasks.dispatch_webhooks`
* **Description:** If a workspace has configured webhooks (e.g., "Send meeting summary to Slack channel"), this task formats the payload and makes the `POST` request. Includes exponential backoff retries if the external server is down.

## 5. Concurrency & Locking
* **Problem:** If a scheduled job (like Analytics Aggregation) takes longer than 24 hours to run, the next day's job might start while the first is still running, causing race conditions or duplicate billing.
* **Solution:** Implement Distributed Locks using Redis (e.g., `redis-py` lock).
```python
@celery.task(bind=True)
def aggregate_daily_usage(self):
    lock_id = "lock:aggregate_daily_usage"
    # Acquire lock with a timeout of 12 hours
    if redis_client.set(lock_id, "locked", nx=True, ex=43200):
        try:
            # Perform aggregation...
            pass
        finally:
            redis_client.delete(lock_id)
    else:
        logger.info("Task already running, skipping...")
```

## 6. Error Monitoring
* All Celery exceptions must be caught and forwarded to Sentry.
* Celery Beat logs must be monitored in Prometheus/Grafana to ensure scheduled tasks haven't silently stopped firing (a common failure mode for Celery Beat).
