import logging
import re
from logging.config import dictConfig
from typing import Any

from app.core.config import Settings

INVITATION_PATH_PATTERN = re.compile(r"(/auth/invitations/)[^?&\s\"']+")
TOKEN_QUERY_PATTERN = re.compile(
    r"([?&](?:token|invitation_token|reset_token)=)[^&\s\"']+",
    re.IGNORECASE,
)


def _redact_sensitive_value(value: Any) -> Any:
    text = str(value)
    redacted = INVITATION_PATH_PATTERN.sub(r"\1[REDACTED]", text)
    redacted = TOKEN_QUERY_PATTERN.sub(r"\1[REDACTED]", redacted)
    return redacted if redacted != text else value


class SensitiveTokenFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = _redact_sensitive_value(record.msg)
        if isinstance(record.args, tuple):
            record.args = tuple(_redact_sensitive_value(value) for value in record.args)
        elif isinstance(record.args, dict):
            record.args = {
                key: _redact_sensitive_value(value) for key, value in record.args.items()
            }
        return True


def configure_logging(settings: Settings) -> None:
    level = "DEBUG" if settings.debug else "INFO"
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
                }
            },
            "filters": {
                "sensitive_tokens": {
                    "()": "app.core.logging.SensitiveTokenFilter",
                }
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "filters": ["sensitive_tokens"],
                }
            },
            "root": {
                "handlers": ["default"],
                "level": level,
            },
        }
    )
    logging.getLogger("uvicorn.access").setLevel(level)
