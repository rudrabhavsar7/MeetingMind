"""Safely switch the ignored development environment to a Supabase session pooler."""

from __future__ import annotations

import argparse
import asyncio
import os
import re
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings

BACKEND_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_ROOT / ".env"
DATABASE_PATTERN = re.compile(r"^MEETINGMIND_DATABASE_URL=.*$", re.MULTILINE)
ENVIRONMENT_PATTERN = re.compile(r"^MEETINGMIND_ENV=(.+)$", re.MULTILINE)
DIRECT_HOST_PATTERN = re.compile(r"^db\.([a-z0-9]+)\.supabase\.co$")
POOLER_HOST_PATTERN = re.compile(r"^aws-[a-z0-9-]+\.pooler\.supabase\.com$")


def build_pooler_url(settings: Settings, pooler_host: str) -> URL:
    if not POOLER_HOST_PATTERN.fullmatch(pooler_host):
        raise SystemExit("Pooler host is not an official Supabase pooler hostname")

    database_url = make_url(settings.database_url)
    direct_host = database_url.host or ""
    host_match = DIRECT_HOST_PATTERN.fullmatch(direct_host)
    if host_match is None:
        raise SystemExit("Expected the current URL to use a direct Supabase database hostname")

    role = database_url.username
    if not role:
        raise SystemExit("The current database URL does not contain a role")

    project_ref = host_match.group(1)
    return database_url.set(
        host=pooler_host,
        port=5432,
        username=f"{role}.{project_ref}",
    )


async def verify_connection(database_url: URL) -> None:
    engine = create_async_engine(
        database_url,
        poolclass=NullPool,
        connect_args={"timeout": 10, "command_timeout": 10},
    )
    try:
        async with engine.connect() as connection:
            await connection.execute(text("select 1"))
    except Exception as exc:
        raise SystemExit(
            f"Pooler connection failed ({exc.__class__.__name__}); "
            "local configuration was unchanged"
        ) from None
    finally:
        await engine.dispose()


def update_local_environment(database_url: URL) -> None:
    contents = ENV_PATH.read_text(encoding="utf-8")
    environment_match = ENVIRONMENT_PATTERN.search(contents)
    if environment_match and environment_match.group(1).strip() != "development":
        raise SystemExit("Refusing to modify a non-development environment")

    rendered_url = database_url.render_as_string(hide_password=False)
    updated, replacements = DATABASE_PATTERN.subn(
        f"MEETINGMIND_DATABASE_URL={rendered_url}",
        contents,
    )
    if replacements != 1:
        raise SystemExit("Expected exactly one MEETINGMIND_DATABASE_URL entry")

    temporary_path = ENV_PATH.with_suffix(".env.pooler.tmp")
    try:
        temporary_path.write_text(updated, encoding="utf-8")
        os.replace(temporary_path, ENV_PATH)
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True, help="Supabase session pooler hostname")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Update apps/backend/.env after the connection test passes",
    )
    args = parser.parse_args()

    if not ENV_PATH.is_file():
        raise SystemExit("apps/backend/.env does not exist")

    pooler_url = build_pooler_url(Settings(), args.host)
    asyncio.run(verify_connection(pooler_url))
    print("Supabase session-pooler connection test passed.")

    if args.write:
        update_local_environment(pooler_url)
        print("Updated the ignored development database URL; credentials were not displayed.")
    else:
        print("Dry run only; local configuration was unchanged.")


if __name__ == "__main__":
    main()
