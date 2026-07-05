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

## Verification

```powershell
poetry run ruff check .
poetry run mypy .
poetry run pytest
```
