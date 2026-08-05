# ===========================================================================
# MeetingMind Backend — Multi-stage Production Dockerfile
#
# Produces a single image that can run:
#   api:      uvicorn app.main:app
#   worker:   celery -A app.tasks worker
#   migrate:  alembic upgrade head
#
# Build:  docker build -t meetingmind-api apps/backend
# ===========================================================================

# ---- Stage 1: dependency builder ------------------------------------------
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "poetry>=2.0,<3.0"

WORKDIR /build

# Copy only dependency manifests first for layer caching
COPY pyproject.toml poetry.lock ./

# Export to requirements.txt and install into a venv
RUN poetry export --without dev --format requirements.txt --output requirements.txt && \
    python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---- Stage 2: runtime image ----------------------------------------------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Runtime dependencies: libpq for asyncpg, ffmpeg for audio processing
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application source and Alembic config
WORKDIR /app
COPY app/ ./app/
COPY migrations/ ./migrations/
COPY alembic.ini ./

# Ensure non-root ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default: run the API server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
