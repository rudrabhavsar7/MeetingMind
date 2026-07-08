from __future__ import annotations

import uuid
from collections.abc import Generator
from dataclasses import dataclass
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.api.v1.auth import get_auth_service
from app.core.config import Settings
from app.main import create_app
from app.models import RefreshToken, User
from app.services.auth import AuthService

TEST_JWT_SECRET = "test-secret-with-at-least-32-bytes"


class InMemoryAuthRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, User] = {}
        self.users_by_id: dict[uuid.UUID, User] = {}
        self.refresh_tokens_by_hash: dict[str, RefreshToken] = {}

    async def get_user_by_email(self, email: str) -> User | None:
        return self.users_by_email.get(email)

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.users_by_id.get(user_id)

    async def create_user(self, *, email: str, full_name: str, password_hash: str) -> User:
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            password_hash=password_hash,
        )
        self.users_by_email[email] = user
        self.users_by_id[user.id] = user
        return user

    async def create_refresh_token(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            id=uuid.uuid4(),
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.refresh_tokens_by_hash[token_hash] = refresh_token
        return refresh_token

    async def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        return self.refresh_tokens_by_hash.get(token_hash)

    async def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        *,
        replaced_by_token_id: uuid.UUID | None = None,
    ) -> None:
        refresh_token.revoked_at = datetime.now(UTC)
        refresh_token.replaced_by_token_id = replaced_by_token_id


@dataclass(frozen=True, slots=True)
class AuthTestContext:
    client: TestClient
    repository: InMemoryAuthRepository


@pytest.fixture
def auth_context() -> Generator[AuthTestContext, None, None]:
    app = create_app(Settings(jwt_secret=TEST_JWT_SECRET, env="development"))
    repository = InMemoryAuthRepository()
    auth_service = AuthService(repository, Settings(jwt_secret=TEST_JWT_SECRET, env="development"))

    async def override_auth_service() -> AuthService:
        return auth_service

    app.dependency_overrides[get_auth_service] = override_auth_service
    with TestClient(app) as client:
        yield AuthTestContext(client=client, repository=repository)
    app.dependency_overrides.clear()


def test_register_sets_refresh_cookie_and_returns_access_token(
    auth_context: AuthTestContext,
) -> None:
    response = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "Rudra@Example.com",
            "full_name": "Rudra",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "rudra@example.com"
    assert response.cookies.get("refresh_token")


def test_register_rejects_duplicate_email(auth_context: AuthTestContext) -> None:
    payload = {
        "email": "rudra@example.com",
        "full_name": "Rudra",
        "password": "SecurePass123",
    }

    assert auth_context.client.post("/api/v1/auth/register", json=payload).status_code == 201
    response = auth_context.client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 409


def test_login_and_current_user_flow(auth_context: AuthTestContext) -> None:
    payload = {
        "email": "rudra@example.com",
        "full_name": "Rudra",
        "password": "SecurePass123",
    }
    auth_context.client.post("/api/v1/auth/register", json=payload)

    login_response = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "rudra@example.com", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]
    me_response = auth_context.client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert login_response.status_code == 200
    assert login_response.cookies.get("refresh_token")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "rudra@example.com"


def test_invalid_login_returns_unauthorized(auth_context: AuthTestContext) -> None:
    response = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "WrongPass123"},
    )

    assert response.status_code == 401


def test_refresh_rotates_refresh_cookie(auth_context: AuthTestContext) -> None:
    register_response = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "rudra@example.com",
            "full_name": "Rudra",
            "password": "SecurePass123",
        },
    )
    old_refresh_token = register_response.cookies.get("refresh_token")
    assert old_refresh_token is not None

    auth_context.client.cookies.set("refresh_token", old_refresh_token)
    refresh_response = auth_context.client.post("/api/v1/auth/refresh")

    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]
    assert refresh_response.cookies.get("refresh_token") != old_refresh_token


def test_logout_revokes_refresh_cookie(auth_context: AuthTestContext) -> None:
    register_response = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "rudra@example.com",
            "full_name": "Rudra",
            "password": "SecurePass123",
        },
    )
    refresh_token = register_response.cookies.get("refresh_token")
    assert refresh_token is not None

    auth_context.client.cookies.set("refresh_token", refresh_token)
    response = auth_context.client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_current_user_requires_bearer_token(auth_context: AuthTestContext) -> None:
    response = auth_context.client.get("/api/v1/auth/me")

    assert response.status_code == 401
