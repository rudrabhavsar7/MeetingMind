"""
One-off dev script: reset a user's password in the database.
Usage:
    poetry run python scripts/reset_password.py <email> <new_password>
"""

from __future__ import annotations

import asyncio

# ---- load DB URL from .env -----------------------------------------------
import os
import sys
from pathlib import Path

import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

DATABASE_URL = os.environ["MEETINGMIND_DATABASE_URL"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def reset(email: str, new_password: str) -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    hashed = hash_password(new_password)
    async with engine.begin() as conn:
        result = await conn.execute(
            text("UPDATE users SET password_hash = :h WHERE email = :e RETURNING id"),
            {"h": hashed, "e": email},
        )
        row = result.fetchone()
        if row is None:
            print(f"ERROR: No user found with email '{email}'")
            sys.exit(1)
        print(f"Password updated for {email} (user id: {row[0]})")
    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: poetry run python scripts/reset_password.py <email> <new_password>")
        sys.exit(1)
    asyncio.run(reset(sys.argv[1], sys.argv[2]))
