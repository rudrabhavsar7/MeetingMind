---
Title: MeetingMind — DevOps: Monitoring & Alerting
Version: 2.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-07-11
Dependencies: 05-devops/infrastructure.md
---

# MeetingMind DevOps: Monitoring & Alerting

## 1. Default Local Stack

Services emit structured JSON to stdout/stderr. Prometheus collects application and host metrics, Grafana displays local dashboards, and Flower may be enabled for Celery operations on an administrator-only network. Alertmanager can route notifications to an operator-configured local or external destination.

Hosted error tracking, product analytics, APM, and paging are optional and disabled by default. Enabling them requires an egress/data review; transcript text, audio, summary text, participant names/emails, access tokens, signed URLs, and prompt bodies must never be sent as telemetry.

## 2. Required Signals

- Host/container CPU, memory, disk capacity, filesystem errors, restarts, and GPU utilization/VRAM where present.
- API request count, duration, status, active WebSockets, handshake failures, reconnects, sequence gaps, and heartbeat timeouts.
- PostgreSQL connection saturation, query latency, storage growth, backup age, and pgvector query duration.
- Redis availability, memory, evictions, Celery queue depth/age, retries, and dead-letter/final failures.
- MinIO capacity, request failures, and retained-media growth.
- Local STT, diarization, embedding, and LLM duration/failure metrics labeled by non-sensitive model/version identifiers.
- Pipeline time-to-first-transcript, finalization duration, citation-validation failures, and uncited-output rejection count.

Workspace and meeting UUIDs may appear in access-controlled logs for correlation but should not be unbounded metric labels. Never log raw WebSocket frames or AI input/output bodies.

## 3. Baseline Alerts

- **Critical:** API unavailable, PostgreSQL/Redis/MinIO unavailable, disk above 95%, repeated backup failure, or citation/workspace-isolation invariant failure.
- **High:** five-minute API error rate above 5%, oldest live-processing queue item above the measured SLO, WebSocket gap spike, GPU out-of-memory loop, or disk above 85%.
- **Warning:** model latency regression, repeated processing failure for one meeting, certificate nearing expiry, backup restore drill overdue, or retained-media growth outside forecast.

Thresholds should be tuned from measured baselines. Alerts must identify the affected component and link to a runbook; they must not include meeting content.

## 4. Health Dashboard

The local MeetingMind dashboard should show service health, request/error latency, active live sessions, queue depth/age, AI-stage latency/failures, database/object-store capacity, last successful backup, and certificate expiry. Retention for logs and metrics is operator-configurable and should default to the minimum needed for operations.
