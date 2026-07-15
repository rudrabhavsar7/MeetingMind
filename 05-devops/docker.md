---
Title: MeetingMind — DevOps: Docker Configuration
Version: 2.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-07-11
Dependencies: 05-devops/infrastructure.md, 02-engineering/deployment.md
---

# MeetingMind DevOps: Docker Configuration

## 1. Repository Reality

The application scaffolds live under `apps/backend`, `apps/frontend`, and `apps/extension`. A complete production `docker-compose.yml` and production Dockerfiles are not yet present. This document defines their acceptance contract; it is not a runnable Compose example.

## 2. Target Build Artifacts

- `apps/backend/Dockerfile`: multi-stage Python 3.11/3.12 image using the committed Poetry lockfile, FFmpeg/runtime libraries, the existing `app` package, and a non-root runtime user. The same immutable image may run API, migrations, and worker commands.
- `apps/frontend/Dockerfile`: multi-stage Node build using `npm ci` and Next.js standalone output, with telemetry disabled by default and a non-root runtime user.
- `apps/extension`: deterministic production build packaged separately; it is not served as a privileged part of the Compose network.
- Root Compose production profile and a development override/profile.

Do not copy a nonexistent `src` backend package or install from an untracked `requirements.txt`; the current backend source is `apps/backend/app` and dependencies are defined by `pyproject.toml`/`poetry.lock`.

## 3. Compose Services and Networks

The production profile includes `nginx`, `frontend`, `api`, `worker`, `postgres`, `redis`, `minio`, `ollama`, and any explicitly separated local STT/diarization worker. Only Nginx publishes public ports. Internal health checks and dependency readiness are required; startup order alone is not readiness.

Persistent named volumes cover PostgreSQL, MinIO, and model data. Temporary processing storage is bounded and cleaned. Application containers run non-root, drop unnecessary capabilities, use read-only filesystems where practical, and receive secrets/configuration at runtime.

## 4. Development Profile

Development may publish database/Redis/MinIO ports to loopback only, mount source code, and use reload commands. It uses disposable data and safe placeholder secrets. Production must never use reload servers, bind internal services publicly, mount the source tree, or contain default passwords.

## 5. Image and Runtime Rules

- Pin base images and production service images to reviewed versions/digests; avoid floating `latest` tags.
- Build reproducibly from lockfiles and emit an SBOM/checksum with releases.
- Do not bake `.env`, credentials, models with unverified licenses, or user data into images.
- Emit structured logs to stdout/stderr and configure rotation at the Docker/host layer.
- Provide health checks for Nginx, frontend, API, PostgreSQL, Redis, MinIO, and local model readiness.
- Apply CPU/memory limits and GPU reservations based on measured capacity; prevent one model process from exhausting the host.
- Run Alembic as a controlled one-off release step, not concurrently from every API replica.

## 6. Required Verification Before Calling the Bundle Shippable

Validate a clean-host install, CPU-only mode, GPU mode where supported, bootstrap/invitation flow, WebSocket audio acknowledgements/reconnect, MinIO signed uploads/downloads, AI processing, restart persistence, backup/restore, internal-port isolation, placeholder-secret rejection, and zero meeting-content egress under the default configuration.
