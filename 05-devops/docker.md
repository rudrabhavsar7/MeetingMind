---
Title: MeetingMind — DevOps: Docker Configuration
Version: 1.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-06-28
Dependencies: 05-devops/infrastructure.md
---

# MeetingMind DevOps: Docker Configuration

## 1. Overview
MeetingMind utilizes Docker for consistent environments across local development, CI/CD testing, and production deployment.

## 2. Repository Structure
We use a monorepo approach with multiple `Dockerfiles`.
```text
/apps/frontend/Dockerfile
/apps/backend/Dockerfile
/docker-compose.yml
```

## 3. Backend Dockerfile (FastAPI + Celery)
The backend container is a multi-purpose image. The same image is used to run the API server and the Celery workers, differentiated by the `CMD` passed at runtime.

### 3.1 Base Image
Use a slim Python image to reduce attack surface.
```dockerfile
FROM python:3.11-slim as base
# Install system dependencies (FFmpeg is critical for audio processing)
RUN apt-get update && apt-get install -y ffmpeg libpq-dev gcc && rm -rf /var/lib/apt/lists/*
```

### 3.2 Dependency Management
We use `poetry` or `uv` for deterministic dependency resolution.
```dockerfile
FROM base as builder
RUN pip install uv
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt
```

### 3.3 Final Stage
```dockerfile
FROM base as final
# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app
COPY ./src /app/src

# Create non-root user for security
RUN useradd -m appuser
USER appuser

EXPOSE 8000
```

## 4. Frontend Dockerfile (Next.js)
Optimized for Next.js standalone output to drastically reduce image size (from >1GB to ~150MB).

```dockerfile
FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensures Next.js builds the standalone directory
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy only the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## 5. Local Development (Docker Compose)
The `docker-compose.yml` spins up the entire stack, including dependencies like Postgres (with pgvector) and Redis.

```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: meetingmind
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: 
      context: ./apps/backend
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./apps/backend/src:/app/src
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  celery_worker:
    build: 
      context: ./apps/backend
    command: celery -A src.worker.app worker --loglevel=info
    volumes:
      - ./apps/backend/src:/app/src
    depends_on:
      - redis
      - postgres

  frontend:
    build:
      context: ./apps/frontend
    command: npm run dev
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
```

## 6. Production Considerations
* **Never use `--reload` or `npm run dev` in production.**
* Ensure logs are routed to `stdout`/`stderr` so the orchestrator (ECS/Kubernetes) can capture them.
* Do not embed `.env` files in the Docker image. Pass them at runtime via the orchestrator.
