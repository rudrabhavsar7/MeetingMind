from __future__ import annotations

import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from typing import Protocol
from urllib.parse import urlencode

from app.core.config import Settings
from app.services.auth import PasswordResetDispatch


class PasswordResetNotifier(Protocol):
    async def send(self, dispatch: PasswordResetDispatch) -> None: ...


class DisabledPasswordResetNotifier:
    async def send(self, dispatch: PasswordResetDispatch) -> None:
        return None


class SMTPPasswordResetNotifier:
    def __init__(self, settings: Settings) -> None:
        smtp_host = settings.smtp_host
        smtp_from_email = settings.smtp_from_email
        if smtp_host is None or smtp_from_email is None:
            raise ValueError("SMTP notifier requires a host and sender")
        self._settings = settings
        self._smtp_host = smtp_host
        self._smtp_from_email = smtp_from_email

    async def send(self, dispatch: PasswordResetDispatch) -> None:
        await asyncio.to_thread(self._send_sync, dispatch)

    def _send_sync(self, dispatch: PasswordResetDispatch) -> None:
        reset_url = (
            f"{self._settings.frontend_url.rstrip('/')}/reset-password#"
            f"{urlencode({'token': dispatch.token})}"
        )
        message = EmailMessage()
        message["Subject"] = "Reset your MeetingMind password"
        message["From"] = self._smtp_from_email
        message["To"] = dispatch.email
        message.set_content(
            "A password reset was requested for your MeetingMind account.\n\n"
            f"Reset your password: {reset_url}\n\n"
            f"This link expires at {dispatch.expires_at.isoformat()}. "
            "If you did not request this, you can ignore this message."
        )

        with smtplib.SMTP(
            self._smtp_host,
            self._settings.smtp_port,
            timeout=self._settings.smtp_timeout_seconds,
        ) as smtp:
            if self._settings.smtp_starttls:
                smtp.starttls(context=ssl.create_default_context())
            if self._settings.smtp_username is not None:
                password = self._settings.smtp_password
                if password is None:
                    raise ValueError("SMTP password is required with SMTP username")
                smtp.login(self._settings.smtp_username, password.get_secret_value())
            smtp.send_message(message)


def build_password_reset_notifier(settings: Settings) -> PasswordResetNotifier:
    if settings.password_reset_notifier == "smtp":
        return SMTPPasswordResetNotifier(settings)
    return DisabledPasswordResetNotifier()
