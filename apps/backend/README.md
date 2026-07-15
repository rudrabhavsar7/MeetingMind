# MeetingMind Backend

FastAPI backend scaffold for MeetingMind.

## Local Development

```powershell
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Generate a unique JWT signing secret of at least 32 bytes for each environment and store it only in
the uncommitted environment file or approved secret manager. Staging and production startup rejects
short secrets and known placeholders.

Rotate only the ignored local development secret with:

```powershell
poetry run python -m scripts.rotate_local_jwt_secret
```

The command refuses to modify an `.env` explicitly configured for staging or production and never
prints the generated value. Configure those environments through their approved secret manager.

Useful endpoints:

- `GET /health`
- `GET /api/v1/health`
- `GET /docs`

## Database Migrations

Alembic is configured from `apps/backend` and reads `MEETINGMIND_DATABASE_URL` through the
backend settings layer.

Supabase direct database hostnames are IPv6-only unless the project has the IPv4 add-on. On an
IPv4-only development network, copy the Session Pooler host from the project's **Connect** dialog,
then safely test and update the ignored local environment without displaying credentials:

```powershell
poetry run python -m scripts.configure_supabase_session_pooler --host <session-pooler-host> --write
```

The configurator is development-only, uses session mode on port `5432`, verifies the connection
before writing, and leaves the existing URL unchanged when verification fails.

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

To exercise concurrent bootstrap protection, invitation registration, password reset, login,
current user, refresh rotation, and logout against the configured PostgreSQL database, start from
an empty development schema and run:

```powershell
poetry run python -m scripts.smoke_real_auth
```

The smoke test uses a generated signing key, creates uniquely named synthetic rows, and removes
all created authentication data before exiting. It refuses to run when users or workspaces already
exist.

Password-reset tokens are passed only to the injectable `PasswordResetNotifier` dependency. Delivery
is disabled by default. To use an operator-approved local SMTP sink such as Mailpit, set
`MEETINGMIND_PASSWORD_RESET_NOTIFIER=smtp`, configure the `MEETINGMIND_SMTP_*` values in the ignored
environment file, and set `MEETINGMIND_FRONTEND_URL` to the browser application's origin. Keep the
notifier disabled when no sink is running. Reset links carry the token in a browser-only URL fragment
so it is not sent in HTTP request logs; raw reset tokens are never logged or returned by the API.
