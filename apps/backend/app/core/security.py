from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError


class TokenError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class TokenClaims:
    subject: uuid.UUID
    token_type: str
    expires_at: datetime


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(
    *,
    subject: uuid.UUID,
    secret: str,
    algorithm: str,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": "access",
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_token(*, token: str, secret: str, algorithm: str, expected_type: str) -> TokenClaims:
    try:
        payload = jwt.decode(token, secret, algorithms=[algorithm])
    except ExpiredSignatureError as exc:
        raise TokenError("Token has expired") from exc
    except InvalidTokenError as exc:
        raise TokenError("Token is invalid") from exc

    subject = payload.get("sub")
    token_type = payload.get("type")
    expires_at = payload.get("exp")
    if not isinstance(subject, str) or not isinstance(token_type, str):
        raise TokenError("Token is missing required claims")
    if token_type != expected_type:
        raise TokenError("Token type is invalid")

    try:
        parsed_subject = uuid.UUID(subject)
    except ValueError as exc:
        raise TokenError("Token subject is invalid") from exc

    if not isinstance(expires_at, int):
        raise TokenError("Token expiry is invalid")

    return TokenClaims(
        subject=parsed_subject,
        token_type=token_type,
        expires_at=datetime.fromtimestamp(expires_at, UTC),
    )


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
