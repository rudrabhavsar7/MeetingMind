# MeetingMind Backend

FastAPI backend scaffold for MeetingMind.

## Local Development

```powershell
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Useful endpoints:

- `GET /health`
- `GET /api/v1/health`
- `GET /docs`

## Database Migrations

Alembic is configured from `apps/backend` and reads `MEETINGMIND_DATABASE_URL` through the
backend settings layer.

```powershell
poetry run alembic upgrade head
poetry run alembic downgrade -1
poetry run alembic revision --autogenerate -m "describe change"
```

## Verification

```powershell
poetry run ruff check .
poetry run mypy .
poetry run pytest
```
