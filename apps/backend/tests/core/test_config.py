from pathlib import Path

import pytest
from pydantic import ValidationError

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


@pytest.mark.parametrize("env", ["staging", "production"])
def test_shared_environments_reject_weak_jwt_secrets(env: str) -> None:
    with pytest.raises(ValidationError, match="at least 32 bytes"):
        Settings(env=env, jwt_secret="change-me")


def test_shared_environments_accept_strong_jwt_secrets() -> None:
    settings = Settings(
        env="staging",
        jwt_secret="generated-test-secret-with-at-least-32-bytes",
    )

    assert settings.jwt_secret.get_secret_value().startswith("generated-test-secret")


def test_smtp_notifier_requires_host_and_sender() -> None:
    with pytest.raises(ValidationError, match="SMTP password-reset delivery requires"):
        Settings(password_reset_notifier="smtp")


def test_smtp_credentials_must_be_configured_as_a_pair() -> None:
    with pytest.raises(ValidationError, match="must be set together"):
        Settings(
            password_reset_notifier="smtp",
            smtp_host="localhost",
            smtp_from_email="meetingmind@localhost",
            smtp_username="meetingmind",
        )

    settings = Settings()

    assert settings.cors_origins == ["http://localhost:3000", "chrome-extension://*"]
    assert str(settings.storage_endpoint) == "http://localhost:9000/"

    get_settings.cache_clear()
