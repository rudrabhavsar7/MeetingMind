from __future__ import annotations

import uuid
from datetime import timedelta

import pytest

from app.core.security import (
    TokenError,
    create_access_token,
    decode_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

TEST_JWT_SECRET = "test-secret-with-at-least-32-bytes"


def test_password_hashing_round_trip() -> None:
    password_hash = hash_password("SecurePass123")

    assert password_hash != "SecurePass123"
    assert verify_password("SecurePass123", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_round_trip() -> None:
    subject = uuid.uuid4()
    token = create_access_token(
        subject=subject,
        secret=TEST_JWT_SECRET,
        algorithm="HS256",
        expires_delta=timedelta(minutes=15),
    )

    claims = decode_token(
        token=token,
        secret=TEST_JWT_SECRET,
        algorithm="HS256",
        expected_type="access",
    )

    assert claims.subject == subject
    assert claims.token_type == "access"


def test_expired_access_token_is_rejected() -> None:
    token = create_access_token(
        subject=uuid.uuid4(),
        secret=TEST_JWT_SECRET,
        algorithm="HS256",
        expires_delta=timedelta(seconds=-1),
    )

    with pytest.raises(TokenError):
        decode_token(
            token=token,
            secret=TEST_JWT_SECRET,
            algorithm="HS256",
            expected_type="access",
        )


def test_refresh_token_hashing_is_stable_and_non_reversible() -> None:
    refresh_token = generate_refresh_token()
    token_hash = hash_refresh_token(refresh_token)

    assert len(refresh_token) > 32
    assert token_hash == hash_refresh_token(refresh_token)
    assert token_hash != refresh_token
