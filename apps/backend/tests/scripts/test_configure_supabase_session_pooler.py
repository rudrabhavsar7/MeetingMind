from __future__ import annotations

import pytest

from app.core.config import Settings
from scripts.configure_supabase_session_pooler import build_pooler_url


def test_build_pooler_url_preserves_credentials_and_uses_tenant_username() -> None:
    settings = Settings(
        database_url=(
            "postgresql+asyncpg://meetingmind_dev:test-password@"
            "db.abcdefghijklmnopqrst.supabase.co:5432/postgres?ssl=require"
        )
    )

    pooler_url = build_pooler_url(
        settings,
        "aws-1-ap-northeast-2.pooler.supabase.com",
    )

    assert pooler_url.host == "aws-1-ap-northeast-2.pooler.supabase.com"
    assert pooler_url.port == 5432
    assert pooler_url.username == "meetingmind_dev.abcdefghijklmnopqrst"
    assert pooler_url.password == "test-password"
    assert pooler_url.query["ssl"] == "require"


def test_build_pooler_url_rejects_untrusted_host() -> None:
    settings = Settings(
        database_url=(
            "postgresql+asyncpg://meetingmind_dev:test-password@"
            "db.abcdefghijklmnopqrst.supabase.co:5432/postgres?ssl=require"
        )
    )

    with pytest.raises(SystemExit, match="official Supabase pooler"):
        build_pooler_url(settings, "database.attacker.example")
