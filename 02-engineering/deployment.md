---
Title: MeetingMind — Deployment
Version: 2.0.0
Status: Approved
Owner: Lead DevOps
Last Updated: 2026-07-11
Dependencies: 00-project/architecture-overview.md, 05-devops/infrastructure.md
---

# MeetingMind — v1 Deployment Contract

## 1. Deployment Artifact

The normative v1 artifact is a versioned Docker Compose bundle for an operator-controlled Linux server. Its target services are Nginx, frontend, API, worker, PostgreSQL with pgvector, Redis, MinIO, Ollama, and local STT/diarization workers.

The repository does not yet contain a complete production Compose bundle or all production Dockerfiles. Until the relevant foundation ticket delivers and verifies them, commands in deployment documentation are illustrative and must not be advertised as a working install.

## 2. Operator Prerequisites

- Supported Linux host with Docker Engine and Docker Compose v2.
- DNS name and TLS certificate strategy for HTTPS/WSS.
- Persistent encrypted storage sized for PostgreSQL, models, imports, and configured media retention.
- At least 4 CPU cores, 16 GB RAM, and 100 GB storage for a small CPU-only evaluation; production sizing must be based on measured concurrency and model selection.
- For GPU acceleration, a compatible NVIDIA GPU, current driver, NVIDIA Container Toolkit, and model-specific VRAM capacity.
- A separate encrypted backup destination and a restore-drill schedule.

## 3. Configuration Contract

Configuration is injected at runtime through an operator-owned environment file or Docker secrets. A committed `.env.example` may contain names and safe placeholders only. At minimum the deployment will require generated application/JWT secrets, database credentials, MinIO credentials, public URLs, allowed origins, retention settings, model identifiers, and storage paths.

No external-provider key is required for the default installation. An `OPENAI_API_KEY`, hosted telemetry DSN, SMTP credential, or cloud credential is optional and must have no effect unless its integration is explicitly enabled.

## 4. Release Procedure

1. Back up PostgreSQL and verify adequate disk space.
2. Pull immutable, signed/versioned images from the configured registry.
3. Review release notes and environment-variable migrations.
4. Run backward-compatible Alembic migrations as a controlled one-off task.
5. Restart services with Compose and verify health, WebSocket upgrades, worker queues, local model availability, and object-store access.
6. Retain the previous image set for application rollback. Prefer fix-forward database migrations; do not automatically run destructive down-migrations.

## 5. Production Acceptance Checks

- First-run bootstrap is reachable only with zero users; subsequent registration is invitation-only.
- HTTPS and WSS succeed through Nginx; internal service ports are not public.
- A test live session receives contiguous acknowledgements and produces cited outputs.
- An import can upload through a short-lived MinIO signed URL and complete locally.
- Network observation confirms no meeting content egress in the default configuration.
- PostgreSQL and MinIO backups can be restored into an isolated test environment.
- Logs and metrics contain identifiers and timings, not transcript/audio content.

## 6. Future Profiles

Multi-node and Kubernetes/Helm deployments are future work. Documentation must not state that a Helm chart, Terraform stack, managed cloud service, or zero-downtime rollout exists until the artifact and its verification are present in the repository.
