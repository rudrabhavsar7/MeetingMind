---
Title: MeetingMind — DevOps: Infrastructure Architecture
Version: 2.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-07-11
Dependencies: 02-engineering/deployment.md, 08-resources/decisions-log.md#adr-013-operator-controlled-docker-compose-as-the-normative-v1-deployment
---

# MeetingMind DevOps: Infrastructure Architecture

## 1. Normative v1 Target

MeetingMind v1 runs on an operator-controlled Linux host with Docker Compose. This is the production reference architecture, not a reduced development profile. By default, meeting audio, transcripts, embeddings, AI outputs, logs, and backups remain within infrastructure selected and controlled by the operator.

The Compose manifest and production Dockerfiles are target delivery artifacts. Until those files are present in the repository, this document is a specification and must not be treated as a working quickstart.

ADR 014 introduces a development/staging-only exception: those environments use the configured Supabase project's managed PostgreSQL/pgvector service with isolated schemas. This does not change the production target or authorize any other Supabase service.

## 2. Service Topology

```text
Browser / Chrome extension
          |
       TLS/WSS
          |
        Nginx
       /     \
  Next.js   FastAPI ---------- Redis
               |                 |
               |              Celery workers
               |              /      |      \
        PostgreSQL+pgvector  STT   pyannote  Ollama
               |
             MinIO <---------- retained/imported media
```

Required services:

1. `nginx`: TLS termination and routing for HTTPS and WebSocket traffic.
2. `frontend`: Next.js web console.
3. `api`: FastAPI HTTP, SSE, and acknowledged WebSocket endpoints.
4. `worker`: Celery queues for imports, finalization, embeddings, and AI jobs. CPU and GPU queues may use the same image with different commands.
5. `postgres`: PostgreSQL 16 with pgvector.
6. `redis`: Celery broker, cache, locks, and ephemeral real-time coordination.
7. `minio`: private S3-compatible object storage.
8. `ollama`: local LLM inference.
9. Local transcription and diarization runtime, colocated with or separated from workers according to GPU capacity.

## 3. Network and Egress Boundary

- Only Nginx exposes host ports publicly. Database, Redis, MinIO administration, Ollama, and worker ports stay on private Compose networks.
- Nginx must support WebSocket upgrades, long-lived connections, request-size limits for import initiation, and operator-configured TLS.
- The default stack requires no outbound access after images/models are installed. Model and image acquisition is an explicit administrative operation.
- External AI, cloud storage, email, analytics, error tracking, and webhook delivery are disabled unless the operator enables the corresponding adapter.
- Enabling an external adapter requires documenting destination, data classes sent, retention, credentials, and a way to disable it. Meeting content must not be routed to an external provider merely as automatic fallback.

## 4. Capacity Profiles

The v1 topology is single-node but workers can be assigned CPU/GPU resources independently. CPU-only operation is supported with slower processing. GPU acceleration is recommended for concurrent live transcription, diarization, and local LLM inference. Exact capacity limits must be established through the performance suite; documentation must not promise a user count without measured evidence.

Persistent volumes are required for PostgreSQL, MinIO, Redis when durable broker behavior is configured, Ollama models, and operator-selected backup staging. Temporary audio workspaces must have size limits and cleanup policies.

## 5. Security Baseline

- Run application containers as non-root with read-only filesystems where practical.
- Pin released images by immutable version or digest; do not deploy `latest` in production.
- Store only private MinIO object keys in PostgreSQL. Generate short-lived signed URLs at request time.
- Use unique generated database, MinIO, and JWT secrets; never ship production defaults.
- Encrypt host volumes or the underlying disk and encrypt backups before they leave the host.
- Apply host firewall rules, OS security updates, Docker security updates, and restricted SSH access.
- Do not place meeting content in logs, metrics labels, traces, or crash reports.

## 6. Availability and Scaling

The v1 reference architecture has a single-host failure domain. Operators must monitor disk capacity and maintain tested encrypted backups. Vertical scaling and separate GPU workers are the first capacity steps.

Managed databases, cloud object storage, multiple worker nodes, Kubernetes, and Helm are future/optional deployment profiles. They must preserve the same privacy, tenant-isolation, provenance, and explicit-egress rules; they are not prerequisites for v1 and no Helm chart is currently promised.
