---
Title: MeetingMind — DevOps: CI/CD Pipeline
Version: 2.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-07-11
Dependencies: 05-devops/docker.md, 02-engineering/deployment.md
---

# MeetingMind DevOps: CI/CD Pipeline

## 1. Continuous Integration

The workflow may run on GitHub Actions or an operator-hosted equivalent. Every pull request must run repository formatting/linting, strict type checks, unit/integration tests, production builds, migration checks, and documentation/link validation. PostgreSQL+pgvector, Redis, and MinIO use isolated service containers. AI, email, telemetry, webhooks, and cloud-provider calls are mocked; CI receives no production secrets or meeting data.

Extension CI must also validate the Manifest V3 manifest, permissions, Chrome 116+ build, and package contents. Security checks include dependency scanning, secret scanning, container/image scanning when images exist, and generated-artifact review.

## 2. Release Artifacts

Once production Dockerfiles and Compose manifests are implemented, tagged releases should publish immutable versioned frontend/backend/extension artifacts, checksums, software-bill-of-materials files, migration notes, environment-variable changes, and release notes. Production examples must pin versions/digests rather than `latest`.

The repository currently documents these as target artifacts; CI/CD must not report deployment success for missing Compose/Dockerfile deliverables.

## 3. Deployment Boundary

CI may build and publish artifacts. Deployment to an operator's staging or production host is a separate authorized action using that operator's runner or pull-based process. The project must not require access to customer infrastructure, AWS, Vercel, or another managed platform.

Before production rollout: confirm a recent backup, run backward-compatible Alembic migrations, update Compose services, and execute health/live-stream/import smoke tests. Environment credentials are injected only at runtime and never used during image build.

## 4. Rollback

Retain the previous immutable image set and Compose configuration for application rollback. Prefer forward-compatible expansion/contraction migrations and fix-forward database changes. A rollback must not automatically run destructive down-migrations. If schema compatibility is uncertain, stop writes, restore into an isolated environment, and follow the documented recovery runbook.

## 5. Branches

`main` is releasable; short-lived feature branches merge through reviewed pull requests. A long-lived `develop` branch is optional team policy, not a deployment requirement. Release tags are the source of production artifact versions.
