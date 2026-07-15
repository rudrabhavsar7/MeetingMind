import logging

from app.core.logging import SensitiveTokenFilter


def test_sensitive_token_filter_redacts_invitation_paths_and_token_queries() -> None:
    invitation_token = "raw-invitation-token"
    reset_token = "raw-reset-token"
    record = logging.LogRecord(
        name="httpx",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg='HTTP Request: %s %s',
        args=(
            "GET",
            f"http://testserver/api/v1/auth/invitations/{invitation_token}"
            f"?reset_token={reset_token}",
        ),
        exc_info=None,
    )

    assert SensitiveTokenFilter().filter(record) is True
    message = record.getMessage()

    assert invitation_token not in message
    assert reset_token not in message
    assert "/auth/invitations/[REDACTED]" in message
    assert "reset_token=[REDACTED]" in message
