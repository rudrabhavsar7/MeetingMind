---
Title: MeetingMind — Deployment
Version: 1.0.0
Status: Approved
Owner: Lead DevOps
Last Updated: 2026-06-28
Dependencies: 00-project/architecture-overview.md
---

# MeetingMind — Deployment Architecture

MeetingMind is designed to be self-hosted by engineering organizations on their own infrastructure, ensuring absolute data privacy. 

## 1. The Deployment Artifact (Docker Compose)

The primary method of deployment for v1.0 is a comprehensive `docker-compose.yml` file. This allows teams to spin up the entire stack on a single Virtual Private Server (VPS) or bare-metal machine.

### Core Services
1. **traefik:** Reverse proxy, handles TLS termination and routes traffic to frontend/backend.
2. **frontend:** Next.js application (Node.js).
3. **api:** FastAPI backend (Python).
4. **worker:** Celery worker for processing audio and LLM tasks.
5. **db:** PostgreSQL database with `pgvector` extension.
6. **redis:** Message broker for Celery and caching.
7. **minio:** S3-compatible object storage.
8. **ollama:** Local LLM inference engine (requires GPU passthrough if available).

## 2. Infrastructure Requirements

### Minimum (CPU Only - Slower AI Processing)
* OS: Ubuntu 22.04 LTS (or equivalent)
* CPU: 4 Cores
* RAM: 16 GB (Ollama + Llama 3 8B requires ~6GB alone)
* Storage: 100 GB NVMe

### Recommended (GPU Accelerated)
* OS: Ubuntu 22.04 LTS
* CPU: 8 Cores
* RAM: 32 GB
* GPU: NVIDIA T4 / RTX 3090 / L4 (Driver >= 535)
* Storage: 500 GB NVMe

## 3. Configuration Management

All configuration is managed via environment variables defined in a `.env` file at the root of the deployment directory.

```env
# Domain and Security
DOMAIN=meetingmind.internal.corp
SECRET_KEY=generate_a_secure_random_string_here

# Database
POSTGRES_USER=meetingmind
POSTGRES_PASSWORD=supersecurepassword
POSTGRES_DB=meetingmind

# MinIO
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=minio_secure_password
```

## 4. GitHub Actions (CI/CD)

For internal development, we use GitHub Actions to build and push Docker images.

1. **On Pull Request:** Runs linters, Pytest, Vitest, and Playwright.
2. **On Push to `develop`:** Builds Docker images, tags them as `:staging`, and pushes to the GitHub Container Registry (GHCR). Triggers a webhook to update the internal staging server.
3. **On Tag (`v1.X.Y`):** Builds production Docker images, tags them with the version and `:latest`, and pushes to GHCR.

## 5. Migration to Kubernetes (Path Forward)

While Docker Compose is sufficient for single-node deployments up to ~100 active users, enterprise clients will eventually require Kubernetes.
* We provide a basic Helm Chart in the `deploy/helm/` directory.
* StatefulSets are used for PostgreSQL, Redis, and MinIO.
* Deployments are used for the API, Frontend, and Workers.
* Horizontal Pod Autoscaling (HPA) is configured for Celery Workers based on queue length (via Prometheus metrics).
