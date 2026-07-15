from __future__ import annotations

import asyncio
import uuid
from collections.abc import Generator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.api.v1.auth import get_auth_service, get_password_reset_notifier
from app.core.config import Settings
from app.core.security import hash_opaque_token, verify_password
from app.main import create_app
from app.models import (
    PasswordResetToken,
    RefreshToken,
    User,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMembership,
    WorkspaceRole,
)
from app.services.auth import (
    AuthService,
    BootstrapClosedError,
    DuplicateEmailError,
    InvalidInvitationError,
    InvalidPasswordResetTokenError,
    InvalidRefreshTokenError,
    InvitationSummary,
    PasswordResetDispatch,
)

TEST_JWT_SECRET = "test-secret-with-at-least-32-bytes"


def bootstrap_payload() -> dict[str, str]:
    return {
        "email": "rudra@example.com",
        "full_name": "Rudra",
        "password": "SecurePass123",
        "workspace_name": "Engineering",
        "workspace_slug": "engineering",
    }


class InMemoryAuthRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, User] = {}
        self.users_by_id: dict[uuid.UUID, User] = {}
        self.refresh_tokens_by_hash: dict[str, RefreshToken] = {}
        self.invitations_by_hash: dict[str, WorkspaceInvitation] = {}
        self.password_reset_tokens_by_hash: dict[str, PasswordResetToken] = {}

    async def has_users(self) -> bool:
        return bool(self.users_by_id)

    async def get_user_by_email(self, email: str) -> User | None:
        return self.users_by_email.get(email)

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.users_by_id.get(user_id)

    async def bootstrap_owner(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        workspace_name: str,
        workspace_slug: str,
    ) -> User:
        if self.users_by_id:
            raise BootstrapClosedError("Bootstrap has already completed")
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            password_hash=password_hash,
            is_active=True,
        )
        workspace = Workspace(
            id=uuid.uuid4(), name=workspace_name, slug=workspace_slug, is_default=True
        )
        WorkspaceMembership(user=user, workspace=workspace, role=WorkspaceRole.OWNER)
        self.users_by_email[email] = user
        self.users_by_id[user.id] = user
        return user

    async def get_invitation_summary(self, token_hash: str) -> InvitationSummary | None:
        invitation = self.invitations_by_hash.get(token_hash)
        now = datetime.now(UTC)
        if (
            invitation is None
            or invitation.accepted_at is not None
            or invitation.revoked_at is not None
            or invitation.expires_at <= now
        ):
            return None
        return InvitationSummary(
            workspace_name=invitation.workspace.name,
            email=invitation.email,
            role=invitation.role,
            expires_at=invitation.expires_at,
        )

    async def register_with_invitation(
        self,
        *,
        token_hash: str,
        email: str,
        full_name: str,
        password_hash: str,
    ) -> User:
        invitation = self.invitations_by_hash.get(token_hash)
        now = datetime.now(UTC)
        if (
            invitation is None
            or invitation.accepted_at is not None
            or invitation.revoked_at is not None
            or invitation.expires_at <= now
            or invitation.email != email
        ):
            raise InvalidInvitationError("Invitation is invalid")
        if email in self.users_by_email:
            raise DuplicateEmailError("Email is already registered")

        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            password_hash=password_hash,
            is_active=True,
        )
        WorkspaceMembership(user=user, workspace=invitation.workspace, role=invitation.role)
        invitation.accepted_at = now
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

    async def rotate_refresh_token(
        self,
        *,
        current_token_hash: str,
        replacement_token_hash: str,
        replacement_expires_at: datetime,
    ) -> tuple[User, RefreshToken]:
        current = self.refresh_tokens_by_hash.get(current_token_hash)
        now = datetime.now(UTC)
        if current is None or current.revoked_at is not None or current.expires_at <= now:
            raise InvalidRefreshTokenError("Refresh token is invalid")
        user = self.users_by_id[current.user_id]
        replacement = RefreshToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=replacement_token_hash,
            expires_at=replacement_expires_at,
        )
        self.refresh_tokens_by_hash[replacement_token_hash] = replacement
        current.revoked_at = now
        current.replaced_by_token_id = replacement.id
        return user, replacement

    async def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        *,
        replaced_by_token_id: uuid.UUID | None = None,
    ) -> None:
        refresh_token.revoked_at = datetime.now(UTC)
        refresh_token.replaced_by_token_id = replaced_by_token_id

    async def replace_password_reset_token(
        self,
        *,
        email: str,
        token_hash: str,
        expires_at: datetime,
    ) -> bool:
        user = self.users_by_email.get(email)
        if user is None or not user.is_active or user.deleted_at is not None:
            return False
        now = datetime.now(UTC)
        for reset_token in self.password_reset_tokens_by_hash.values():
            if (
                reset_token.user_id == user.id
                and reset_token.used_at is None
                and reset_token.revoked_at is None
            ):
                reset_token.revoked_at = now
        reset_token = PasswordResetToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.password_reset_tokens_by_hash[token_hash] = reset_token
        return True

    async def reset_password(self, *, token_hash: str, password_hash: str) -> None:
        reset_token = self.password_reset_tokens_by_hash.get(token_hash)
        now = datetime.now(UTC)
        if (
            reset_token is None
            or reset_token.used_at is not None
            or reset_token.revoked_at is not None
            or reset_token.expires_at <= now
        ):
            raise InvalidPasswordResetTokenError("Password reset token is invalid")
        user = self.users_by_id[reset_token.user_id]
        user.password_hash = password_hash
        reset_token.used_at = now
        for refresh_token in self.refresh_tokens_by_hash.values():
            if refresh_token.user_id == user.id and refresh_token.revoked_at is None:
                refresh_token.revoked_at = now

    def add_invitation(
        self,
        *,
        raw_token: str,
        email: str,
        role: WorkspaceRole = WorkspaceRole.MEMBER,
        expires_at: datetime | None = None,
        revoked_at: datetime | None = None,
        accepted_at: datetime | None = None,
    ) -> WorkspaceInvitation:
        owner = next(iter(self.users_by_id.values()))
        workspace = owner.memberships[0].workspace
        invitation = WorkspaceInvitation(
            id=uuid.uuid4(),
            workspace=workspace,
            email=email,
            role=role,
            token_hash=hash_opaque_token(raw_token),
            invited_by=owner,
            expires_at=expires_at or datetime.now(UTC) + timedelta(days=3),
            revoked_at=revoked_at,
            accepted_at=accepted_at,
        )
        self.invitations_by_hash[invitation.token_hash] = invitation
        return invitation


class RecordingPasswordResetNotifier:
    def __init__(self) -> None:
        self.dispatches: list[PasswordResetDispatch] = []

    async def send(self, dispatch: PasswordResetDispatch) -> None:
        self.dispatches.append(dispatch)


@dataclass(frozen=True, slots=True)
class AuthTestContext:
    client: TestClient
    repository: InMemoryAuthRepository
    notifier: RecordingPasswordResetNotifier


@pytest.fixture
def auth_context() -> Generator[AuthTestContext, None, None]:
    app = create_app(Settings(jwt_secret=TEST_JWT_SECRET, env="development"))
    repository = InMemoryAuthRepository()
    notifier = RecordingPasswordResetNotifier()
    auth_service = AuthService(repository, Settings(jwt_secret=TEST_JWT_SECRET, env="development"))

    async def override_auth_service() -> AuthService:
        return auth_service

    async def override_password_reset_notifier() -> RecordingPasswordResetNotifier:
        return notifier

    app.dependency_overrides[get_auth_service] = override_auth_service
    app.dependency_overrides[get_password_reset_notifier] = override_password_reset_notifier
    with TestClient(app) as client:
        yield AuthTestContext(client=client, repository=repository, notifier=notifier)
    app.dependency_overrides.clear()


def test_register_sets_refresh_cookie_and_returns_access_token(
    auth_context: AuthTestContext,
) -> None:
    response = auth_context.client.post(
        "/api/v1/auth/register",
        json={**bootstrap_payload(), "email": "Rudra@Example.com"},
    )

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "rudra@example.com"
    assert response.cookies.get("refresh_token")


def test_bootstrap_status_changes_after_first_registration(
    auth_context: AuthTestContext,
) -> None:
    before = auth_context.client.get("/api/v1/auth/bootstrap-status")

    assert before.status_code == 200
    assert before.json() == {
        "data": {"setup_required": True, "registration_mode": "bootstrap"}
    }

    auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "rudra@example.com",
            "full_name": "Rudra",
            "password": "SecurePass123",
            "workspace_name": "Engineering",
            "workspace_slug": "engineering",
        },
    )
    after = auth_context.client.get("/api/v1/auth/bootstrap-status")

    assert after.status_code == 200
    assert after.json() == {
        "data": {"setup_required": False, "registration_mode": "invitation_only"}
    }


def test_bootstrap_registration_creates_default_owner_workspace(
    auth_context: AuthTestContext,
) -> None:
    response = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "rudra@example.com",
            "full_name": "Rudra",
            "password": "SecurePass123",
            "workspace_name": "Engineering",
            "workspace_slug": "engineering",
        },
    )

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["access_token"]
    assert body["user"]["workspaces"] == [
        {
            "id": body["user"]["workspaces"][0]["id"],
            "name": "Engineering",
            "slug": "engineering",
            "role": "owner",
        }
    ]
    assert "password_hash" not in response.text

    second = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "second@example.com",
            "full_name": "Second User",
            "password": "SecurePass123",
            "workspace_name": "Other",
            "workspace_slug": "other",
        },
    )
    assert second.status_code == 409


def test_register_rejects_duplicate_email(auth_context: AuthTestContext) -> None:
    payload = bootstrap_payload()

    assert auth_context.client.post("/api/v1/auth/register", json=payload).status_code == 201
    response = auth_context.client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 409


def test_login_and_current_user_flow(auth_context: AuthTestContext) -> None:
    payload = bootstrap_payload()
    auth_context.client.post("/api/v1/auth/register", json=payload)

    login_response = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "rudra@example.com", "password": "SecurePass123"},
    )
    token = login_response.json()["data"]["access_token"]
    me_response = auth_context.client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert login_response.status_code == 200
    assert login_response.cookies.get("refresh_token")
    assert me_response.status_code == 200
    assert me_response.json()["data"]["email"] == "rudra@example.com"


def test_invalid_login_returns_unauthorized(auth_context: AuthTestContext) -> None:
    response = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "WrongPass123"},
    )

    assert response.status_code == 401


def test_refresh_rotates_refresh_cookie(auth_context: AuthTestContext) -> None:
    register_response = auth_context.client.post(
        "/api/v1/auth/register",
        json=bootstrap_payload(),
    )
    old_refresh_token = register_response.cookies.get("refresh_token")
    assert old_refresh_token is not None

    auth_context.client.cookies.set("refresh_token", old_refresh_token)
    refresh_response = auth_context.client.post("/api/v1/auth/refresh")

    assert refresh_response.status_code == 200
    assert refresh_response.json()["data"]["access_token"]
    assert refresh_response.cookies.get("refresh_token") != old_refresh_token

    auth_context.client.cookies.set("refresh_token", old_refresh_token)
    reused_response = auth_context.client.post("/api/v1/auth/refresh")

    assert reused_response.status_code == 401


def test_logout_revokes_refresh_cookie(auth_context: AuthTestContext) -> None:
    register_response = auth_context.client.post(
        "/api/v1/auth/register",
        json=bootstrap_payload(),
    )
    refresh_token = register_response.cookies.get("refresh_token")
    assert refresh_token is not None

    auth_context.client.cookies.set("refresh_token", refresh_token)
    response = auth_context.client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    assert response.json() == {"data": {"status": "ok"}}


def test_current_user_requires_bearer_token(auth_context: AuthTestContext) -> None:
    response = auth_context.client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_invitation_details_and_registration_are_email_bound_and_single_use(
    auth_context: AuthTestContext,
) -> None:
    auth_context.client.post("/api/v1/auth/register", json=bootstrap_payload())
    invitation = auth_context.repository.add_invitation(
        raw_token="valid-invitation-token",
        email="member@example.com",
        role=WorkspaceRole.VIEWER,
    )

    details = auth_context.client.get("/api/v1/auth/invitations/valid-invitation-token")
    wrong_email = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@example.com",
            "full_name": "Other User",
            "password": "SecurePass123",
            "invitation_token": "valid-invitation-token",
        },
    )
    registration = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "member@example.com",
            "full_name": "Invited Member",
            "password": "SecurePass123",
            "invitation_token": "valid-invitation-token",
        },
    )
    reuse = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "member@example.com",
            "full_name": "Invited Member",
            "password": "SecurePass123",
            "invitation_token": "valid-invitation-token",
        },
    )

    assert details.status_code == 200
    assert details.json()["data"] == {
        "workspace_name": "Engineering",
        "email": "member@example.com",
        "role": "viewer",
        "expires_at": invitation.expires_at.isoformat().replace("+00:00", "Z"),
    }
    assert wrong_email.status_code == 403
    assert registration.status_code == 201
    assert registration.json()["data"]["user"]["workspaces"][0]["role"] == "viewer"
    assert invitation.accepted_at is not None
    assert reuse.status_code == 403


@pytest.mark.parametrize("state", ["expired", "revoked", "accepted"])
def test_invitation_errors_do_not_reveal_invalid_state(
    auth_context: AuthTestContext,
    state: str,
) -> None:
    auth_context.client.post("/api/v1/auth/register", json=bootstrap_payload())
    now = datetime.now(UTC)
    auth_context.repository.add_invitation(
        raw_token=f"{state}-invitation-token",
        email=f"{state}@example.com",
        expires_at=now - timedelta(minutes=1) if state == "expired" else None,
        revoked_at=now if state == "revoked" else None,
        accepted_at=now if state == "accepted" else None,
    )

    response = auth_context.client.get(
        f"/api/v1/auth/invitations/{state}-invitation-token"
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Invalid invitation"}


def test_invitation_registration_rejects_client_workspace_fields(
    auth_context: AuthTestContext,
) -> None:
    auth_context.client.post("/api/v1/auth/register", json=bootstrap_payload())
    auth_context.repository.add_invitation(
        raw_token="workspace-field-token",
        email="member@example.com",
    )

    response = auth_context.client.post(
        "/api/v1/auth/register",
        json={
            "email": "member@example.com",
            "full_name": "Invited Member",
            "password": "SecurePass123",
            "workspace_name": "Attacker Workspace",
            "workspace_slug": "attacker-workspace",
            "invitation_token": "workspace-field-token",
        },
    )

    assert response.status_code == 422


def test_forgot_password_is_enumeration_safe_and_replaces_active_token(
    auth_context: AuthTestContext,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    auth_context.client.post("/api/v1/auth/register", json=bootstrap_payload())
    generated_tokens = iter(["first-reset-token", "unknown-reset-token", "second-reset-token"])
    monkeypatch.setattr(
        "app.services.auth.generate_opaque_token",
        lambda: next(generated_tokens),
    )

    known_first = auth_context.client.post(
        "/api/v1/auth/password/forgot",
        json={"email": "Rudra@Example.com"},
    )
    unknown = auth_context.client.post(
        "/api/v1/auth/password/forgot",
        json={"email": "missing@example.com"},
    )
    known_second = auth_context.client.post(
        "/api/v1/auth/password/forgot",
        json={"email": "rudra@example.com"},
    )

    expected_body = {"data": {"status": "accepted"}}
    assert known_first.status_code == unknown.status_code == known_second.status_code == 202
    assert known_first.json() == unknown.json() == known_second.json() == expected_body
    assert [dispatch.token for dispatch in auth_context.notifier.dispatches] == [
        "first-reset-token",
        "second-reset-token",
    ]
    first = auth_context.repository.password_reset_tokens_by_hash[
        hash_opaque_token("first-reset-token")
    ]
    second = auth_context.repository.password_reset_tokens_by_hash[
        hash_opaque_token("second-reset-token")
    ]
    assert first.revoked_at is not None
    assert second.revoked_at is None
    assert second.expires_at - datetime.now(UTC) <= timedelta(minutes=30)
    assert "first-reset-token" not in first.token_hash
    assert "second-reset-token" not in second.token_hash


def test_password_reset_is_single_use_and_revokes_refresh_sessions(
    auth_context: AuthTestContext,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    registration = auth_context.client.post(
        "/api/v1/auth/register",
        json=bootstrap_payload(),
    )
    old_refresh_token = registration.cookies.get("refresh_token")
    assert old_refresh_token is not None
    monkeypatch.setattr(
        "app.services.auth.generate_opaque_token",
        lambda: "password-reset-token",
    )
    auth_context.client.post(
        "/api/v1/auth/password/forgot",
        json={"email": "rudra@example.com"},
    )

    reset = auth_context.client.post(
        "/api/v1/auth/password/reset",
        json={"token": "password-reset-token", "new_password": "NewSecurePass456"},
    )
    reuse = auth_context.client.post(
        "/api/v1/auth/password/reset",
        json={"token": "password-reset-token", "new_password": "AnotherPass789"},
    )
    old_login = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "rudra@example.com", "password": "SecurePass123"},
    )
    new_login = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "rudra@example.com", "password": "NewSecurePass456"},
    )

    stored_reset = auth_context.repository.password_reset_tokens_by_hash[
        hash_opaque_token("password-reset-token")
    ]
    stored_refresh = auth_context.repository.refresh_tokens_by_hash[
        hash_opaque_token(old_refresh_token)
    ]
    user = auth_context.repository.users_by_email["rudra@example.com"]
    assert reset.status_code == 200
    assert reset.json() == {"data": {"status": "password_reset"}}
    assert reuse.status_code == 403
    assert old_login.status_code == 401
    assert new_login.status_code == 200
    assert stored_reset.used_at is not None
    assert stored_refresh.revoked_at is not None
    assert user.password_hash is not None
    assert verify_password("NewSecurePass456", user.password_hash)


def test_expired_password_reset_token_returns_generic_forbidden(
    auth_context: AuthTestContext,
) -> None:
    auth_context.client.post("/api/v1/auth/register", json=bootstrap_payload())
    user = auth_context.repository.users_by_email["rudra@example.com"]
    raw_token = "expired-password-reset-token"
    auth_context.repository.password_reset_tokens_by_hash[hash_opaque_token(raw_token)] = (
        PasswordResetToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=hash_opaque_token(raw_token),
            expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )
    )

    response = auth_context.client.post(
        "/api/v1/auth/password/reset",
        json={"token": raw_token, "new_password": "NewSecurePass456"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Invalid password reset token"}


def test_inactive_user_cannot_login_or_use_existing_access_token(
    auth_context: AuthTestContext,
) -> None:
    registration = auth_context.client.post(
        "/api/v1/auth/register",
        json=bootstrap_payload(),
    )
    access_token = registration.json()["data"]["access_token"]
    auth_context.repository.users_by_email["rudra@example.com"].is_active = False

    login = auth_context.client.post(
        "/api/v1/auth/login",
        json={"email": "rudra@example.com", "password": "SecurePass123"},
    )
    me = auth_context.client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert login.status_code == 401
    assert me.status_code == 401


@pytest.mark.asyncio
async def test_concurrent_bootstrap_creates_only_one_owner_workspace() -> None:
    repository = InMemoryAuthRepository()
    service = AuthService(repository, Settings(jwt_secret=TEST_JWT_SECRET, env="development"))

    async def register(index: int) -> object:
        return await service.register(
            email=f"owner-{index}@example.com",
            full_name=f"Owner {index}",
            password="SecurePass123",
            workspace_name=f"Workspace {index}",
            workspace_slug=f"workspace-{index}",
            invitation_token=None,
        )

    results = await asyncio.gather(register(1), register(2), return_exceptions=True)

    assert len(repository.users_by_id) == 1
    owner = next(iter(repository.users_by_id.values()))
    assert len(owner.memberships) == 1
    assert owner.memberships[0].role == WorkspaceRole.OWNER
    assert sum(isinstance(result, BootstrapClosedError) for result in results) == 1
