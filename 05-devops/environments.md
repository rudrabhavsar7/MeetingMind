---
Title: MeetingMind — DevOps: Environments
Version: 1.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-06-28
Dependencies: 05-devops/infrastructure.md
---

# MeetingMind DevOps: Environments Strategy

## 1. Overview
MeetingMind utilizes multiple isolated environments to ensure that untested code never reaches end users.

## 2. The Three-Tier Architecture

### 2.1 Development (Local)
* **Where:** Developer's laptop via `docker-compose up`.
* **Database:** Local Dockerized PostgreSQL.
* **LLM:** Local Ollama (to save API costs during rapid iteration).
* **Data:** Mock data or small sample videos.
* **Purpose:** Writing code, running unit tests, debugging.

### 2.2 Staging (QA / Pre-Prod)
* **Where:** Cloud infrastructure identical to Production (AWS / Vercel), but scaled down (cheaper instances).
* **URL:** `staging.meetingmind.app`
* **Database:** Cloud RDS, populated with anonymized production-like data or explicit QA test accounts.
* **LLM:** Real OpenAI/Anthropic APIs to verify exact formatting and latency.
* **Deployment:** Automatically deployed when code is merged to the `develop` branch.
* **Purpose:** Integration testing, QA sign-off, client demos, E2E automated tests.

### 2.3 Production
* **Where:** Highly available Cloud Infrastructure.
* **URL:** `app.meetingmind.app`
* **Database:** Multi-AZ Production RDS.
* **Deployment:** Deployed only via controlled releases (tagging a release or merging `develop` to `main`).
* **Purpose:** Live customer traffic.

## 3. Data Isolation Rules
* **CRITICAL:** Staging must NEVER connect to the Production Database or Production S3 Buckets.
* Ensure IAM policies strictly enforce this boundary. (e.g., Staging ECS tasks cannot assume roles that have access to Prod S3).

## 4. Preview Environments (Vercel)
For frontend changes, Vercel automatically spins up ephemeral Preview Environments for every Pull Request.
* e.g., `pr-123.meetingmind.vercel.app`.
* These preview environments point their API calls to the **Staging** backend.
* This allows designers and PMs to visually verify a frontend change before it is merged into `develop`.

## 5. Environment Variables
The application code must be environment-agnostic. It adapts based on the injected variables.
* `ENVIRONMENT=development | staging | production`
* Ensure logging verbosity changes based on this (e.g., `DEBUG` in dev, `WARNING` in prod).
* Ensure features like "Email Sending" are mocked or rerouted in Staging (e.g., using Mailtrap instead of SendGrid) to prevent accidentally emailing real users.
