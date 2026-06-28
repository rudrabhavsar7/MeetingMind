---
Title: MeetingMind — Logging Strategy
Version: 1.0.0
Status: Approved
Owner: Lead DevOps
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind — Logging Strategy

Effective logging is crucial for observing the health of MeetingMind and debugging issues in self-hosted environments where direct database access might be restricted.

## 1. Backend Logging (Python/FastAPI)

MeetingMind replaces Python's standard `logging` module with [**Loguru**](https://github.com/Delgan/loguru) for better formatting, asynchronous capability, and easier configuration.

### 1.1 Configuration
All logs are written to `stdout` (for Docker to capture) and formatted as JSON when running in production (`ENV=prod`) to facilitate ingestion by Elasticsearch, Loki, or Datadog.

```python
# app/core/logging.py
import sys
from loguru import logger
from app.core.config import settings

def setup_logging():
    logger.remove() # Remove default handler
    
    if settings.ENV == "prod":
        logger.add(sys.stdout, serialize=True, level="INFO")
    else:
        logger.add(sys.stdout, colorize=True, format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>", level="DEBUG")
```

### 1.2 Contextual Logging
Logs must include context to be useful. Do not log "User logged in". Log the User ID and IP.

```python
# ❌ BAD
logger.info("Meeting processed successfully.")

# ✅ GOOD (Context bound)
logger.info("Meeting processed successfully", meeting_id=meeting.id, duration_seconds=elapsed, workspace_id=workspace.id)
```

## 2. API Request/Response Logging

A FastAPI middleware captures every incoming request and outgoing response to log latency, status codes, and paths.

```python
import time
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        logger.info(
            "API Request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration=f"{process_time:.3f}s"
        )
        return response
```
*Note: PII and sensitive data (Passwords, Authorization headers, Transcripts) MUST NEVER be logged.*

## 3. Celery Worker Logging

Celery workers run in separate processes. They use the same Loguru configuration but must ensure Task IDs are bound to the logger context.

```python
from celery import Task
from loguru import logger

class BaseContextTask(Task):
    def __call__(self, *args, **kwargs):
        # Bind the celery task ID to all loguru logs within this context
        with logger.contextualize(task_id=self.request.id):
            return super().__call__(*args, **kwargs)
```

## 4. Frontend Logging (Next.js)

### 4.1 Client-Side
* Use `console.log` / `console.error` during development.
* In production, client-side errors should be caught by React Error Boundaries and sent to a telemetry service (e.g., Sentry or PostHog) if the user has opted in. Otherwise, they fail silently in the console to preserve privacy.

### 4.2 Server-Side (RSC)
* Logs generated in Next.js Server Components or API Routes execute on the Node.js server.
* Use `console.log` which Docker will capture via stdout.

## 5. Security & Audit Logs

Distinct from application debug logs, **Audit Logs** record who did what and when. These must be stored immutably in the PostgreSQL database, not just written to stdout.

* **Events to Audit Log:** Login attempts (success/fail), Role changes, Meeting deletions, Workspace settings changes.
* **Format:** `id`, `timestamp`, `user_id`, `workspace_id`, `action`, `resource_id`, `ip_address`.
