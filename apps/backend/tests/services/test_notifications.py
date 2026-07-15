from __future__ import annotations

import smtplib
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from types import TracebackType

import pytest

from app.core.config import Settings
from app.services.auth import PasswordResetDispatch
from app.services.notifications import SMTPPasswordResetNotifier


class FakeSMTP:
    instances: list[FakeSMTP] = []

    def __init__(self, host: str, port: int, *, timeout: int) -> None:
        self.host = host
        self.port = port
        self.timeout = timeout
        self.started_tls = False
        self.login_credentials: tuple[str, str] | None = None
        self.message: EmailMessage | None = None
        self.instances.append(self)

    def __enter__(self) -> FakeSMTP:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        return None

    def starttls(self, *, context: object) -> None:
        self.started_tls = True

    def login(self, username: str, password: str) -> None:
        self.login_credentials = (username, password)

    def send_message(self, message: EmailMessage) -> None:
        self.message = message


@pytest.mark.asyncio
async def test_smtp_notifier_sends_reset_link_without_logging_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    FakeSMTP.instances.clear()
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    settings = Settings(
        password_reset_notifier="smtp",
        frontend_url="https://meetingmind.example",
        smtp_host="mailpit",
        smtp_port=1025,
        smtp_starttls=True,
        smtp_username="meetingmind",
        smtp_password="smtp-test-password",
        smtp_from_email="meetingmind@example.com",
    )
    dispatch = PasswordResetDispatch(
        email="rudra@example.com",
        token="raw-reset-token",
        expires_at=datetime.now(UTC) + timedelta(minutes=30),
    )

    await SMTPPasswordResetNotifier(settings).send(dispatch)

    smtp = FakeSMTP.instances[0]
    assert (smtp.host, smtp.port, smtp.timeout) == ("mailpit", 1025, 10)
    assert smtp.started_tls is True
    assert smtp.login_credentials == ("meetingmind", "smtp-test-password")
    assert smtp.message is not None
    assert smtp.message["To"] == "rudra@example.com"
    assert "https://meetingmind.example/reset-password#token=raw-reset-token" in (
        smtp.message.get_content()
    )
