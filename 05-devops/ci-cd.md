---
Title: MeetingMind — DevOps: CI/CD Pipeline
Version: 1.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-06-28
Dependencies: 05-devops/docker.md
---

# MeetingMind DevOps: CI/CD Pipeline

## 1. Overview
Continuous Integration and Continuous Deployment (CI/CD) automates the testing, building, and deployment of MeetingMind, ensuring rapid, reliable releases.

## 2. Platform
* **Primary:** GitHub Actions.
* **Alternative:** GitLab CI/CD (if strictly self-hosting).

## 3. Continuous Integration (CI)
Runs on every Pull Request to `main` or `develop`.

### 3.1 Frontend CI Workflow
1. **Linting:** Run `npm run lint` (ESLint) and Prettier checks.
2. **Type Checking:** Run `tsc --noEmit`.
3. **Unit Tests:** Run `Vitest` or `Jest`.
4. **Build Test:** Run `npm run build` to ensure Next.js compiles successfully.

### 3.2 Backend CI Workflow
1. **Linting:** Run `ruff check .` and `black --check .`.
2. **Type Checking:** Run `mypy .`.
3. **Test Database Setup:** Spin up a PostgreSQL service container with `pgvector` in the GitHub Action runner.
4. **Unit & Integration Tests:** Run `pytest`. This includes both FastAPI endpoints and Celery tasks (running synchronously).

## 4. Continuous Deployment (CD)
Runs when code is merged into `main` (Production) or `develop` (Staging).

### 4.1 Frontend Deployment
* **Vercel Integration:** Handled automatically by connecting the GitHub repository to Vercel. Vercel automatically builds and deploys to the Edge network.
* **Preview Deployments:** Vercel automatically creates a unique URL for every Pull Request for visual QA.

### 4.2 Backend Deployment (AWS ECS)
1. **Login to ECR:** Authenticate GitHub Action runner with AWS Elastic Container Registry.
2. **Docker Build:** Build the backend image (`apps/backend/Dockerfile`).
3. **Tagging:** Tag the image with the Git commit SHA (e.g., `meetingmind-backend:a1b2c3d`).
4. **Push:** Push the image to ECR.
5. **Database Migration:** Run Alembic migrations. 
   * *Critical:* Migrations must be backward-compatible (e.g., adding a column is fine, dropping a column that the old API version relies on is not).
6. **ECS Update:** Trigger an AWS ECS Service update using the new image tag. ECS will perform a Rolling Update, standing up new containers before draining the old ones, ensuring zero downtime.

## 5. Branching Strategy
* `main`: Represents production. Always stable.
* `develop`: Represents staging/QA.
* `feature/*`: Short-lived branches created from `develop`.

## 6. Secrets in CI
* Do not hardcode secrets.
* Store `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and database URLs in GitHub Actions Secrets.
* Pass these secrets into the environment ONLY during the test or deploy steps, not during the build step (to prevent baking secrets into the Docker image).

## 7. Rollback Strategy
* **Frontend:** Vercel provides a 1-click "Instant Rollback" in their dashboard to instantly serve the previous deployment.
* **Backend:** Re-trigger the GitHub Action CD workflow from an older commit, or use the AWS CLI to revert the ECS Task Definition to the previous revision. Database rollbacks (down-migrations) are inherently risky and should be avoided; prefer "fix forward" strategies.
