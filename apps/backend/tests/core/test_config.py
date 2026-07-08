from pathlib import Path

import pytest

from app.core.config import Settings, get_settings


def test_settings_parse_comma_separated_cors_origins(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "\n".join(
            [
                "MEETINGMIND_CORS_ORIGINS=http://localhost:3000,chrome-extension://*",
                "MEETINGMIND_STORAGE_ENDPOINT=http://localhost:9000",
            ]
        ),
        encoding="utf-8",
    )

    monkeypatch.chdir(tmp_path)
    get_settings.cache_clear()

    settings = Settings()

    assert settings.cors_origins == ["http://localhost:3000", "chrome-extension://*"]
    assert str(settings.storage_endpoint) == "http://localhost:9000/"

    get_settings.cache_clear()
