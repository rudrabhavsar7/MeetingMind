"""Rotate the ignored local development JWT signing secret without displaying it."""

from __future__ import annotations

import os
import re
import secrets
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_ROOT / ".env"
SECRET_PATTERN = re.compile(r"^MEETINGMIND_JWT_SECRET=.*$", re.MULTILINE)
ENVIRONMENT_PATTERN = re.compile(r"^MEETINGMIND_ENV=(.+)$", re.MULTILINE)


def main() -> None:
    if not ENV_PATH.is_file():
        raise SystemExit("apps/backend/.env does not exist")

    contents = ENV_PATH.read_text(encoding="utf-8")
    environment_match = ENVIRONMENT_PATTERN.search(contents)
    if environment_match and environment_match.group(1).strip() != "development":
        raise SystemExit("Refusing to rotate a non-development environment")

    secret = secrets.token_urlsafe(48)
    updated, replacements = SECRET_PATTERN.subn(
        f"MEETINGMIND_JWT_SECRET={secret}",
        contents,
    )
    if replacements != 1:
        raise SystemExit("Expected exactly one MEETINGMIND_JWT_SECRET entry")

    temporary_path = ENV_PATH.with_suffix(".env.rotate.tmp")
    try:
        temporary_path.write_text(updated, encoding="utf-8")
        os.replace(temporary_path, ENV_PATH)
    finally:
        temporary_path.unlink(missing_ok=True)

    print("Rotated the local development JWT secret; value was not displayed.")


if __name__ == "__main__":
    main()
