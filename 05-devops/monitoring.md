---
Title: MeetingMind — DevOps: Monitoring & Alerting
Version: 1.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind DevOps: Monitoring & Alerting

## 1. Overview
MeetingMind relies on extensive AI processing. Standard HTTP monitoring is insufficient; we must monitor queue depths, LLM latency, and transcription failure rates.

## 2. Core Telemetry Stack
* **APM & Logging:** DataDog or Sentry + PostHog.
* **Metrics:** Prometheus & Grafana.
* **Alerting:** PagerDuty.

## 3. Key Metrics to Monitor

### 3.1 Infrastructure Metrics
* CPU/Memory usage of ECS Fargate containers (API & Celery).
* GPU utilization on EC2 instances (Transcription workers).
* Database CPU and Disk I/O (PostgreSQL).
* Redis Memory Usage (Ensure Celery broker isn't OOMing).

### 3.2 Application Metrics (API)
* **P99 Latency:** HTTP Response times (Exclude `/upload` endpoints, focus on `/chat` and general navigation).
* **Error Rate (5xx):** Should be < 0.1%.

### 3.3 AI Pipeline Metrics (Crucial)
* **Celery Queue Depth:** Track the number of tasks in `cpu_tasks` and `gpu_tasks` queues. If `gpu_tasks` > 50, auto-scale up EC2 instances.
* **Pipeline Duration (Time-to-Interactive):** Measure time from user upload completion to summary generation. Goal: < 3x the duration of the audio file.
* **LLM API Errors/Rate Limits:** Track 429s from OpenAI/Anthropic to trigger fallback logic or alert.
* **Token Usage:** Track total tokens consumed per workspace per day for billing/cost analysis.

## 4. Logging Strategy

### 4.1 Structured Logging
All backend logs MUST be emitted as JSON so they can be easily parsed by Logstash/DataDog.
```json
{
  "timestamp": "2026-10-15T14:30:00Z",
  "level": "INFO",
  "logger": "myapp.tasks.transcribe",
  "message": "Transcription completed",
  "workspace_id": "uuid-123",
  "meeting_id": "uuid-456",
  "duration_ms": 45000
}
```

### 4.2 Frontend Error Tracking
Use **Sentry** in the Next.js app to capture unhandled exceptions (React Error Boundaries) and network failures. Sentry automatically groups similar errors and maps them back to the source map.

## 5. Alerting Policies

* **SEV-1 (Critical - PagerDuty Call):** 
  * API Error Rate > 5% for 5 minutes.
  * Database CPU > 95% for 10 minutes.
  * Redis down.
* **SEV-2 (High - Slack Notification):**
  * Celery `gpu_tasks` queue age > 30 minutes (Processing is severely delayed).
  * 3 consecutive LLM API failures.
* **SEV-3 (Low/Warning - Dashboard Only):**
  * 404 Error Rate spike.
  * Individual meeting processing failure (handled via in-app UI to user).

## 6. Dashboards
Create a primary "MeetingMind Health" Grafana dashboard displaying:
1. Active API Requests / sec.
2. Active processing pipelines.
3. Live queue depths.
4. Recent 500 errors.
