from __future__ import annotations

import asyncio
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from httpx import ASGITransport, AsyncClient
from pydantic import SecretStr
from sqlalchemy import delete, func, select

from app.api.v1.auth import get_password_reset_notifier
from app.core.config import get_settings
from app.core.security import hash_opaque_token
from app.db.session import AsyncSessionLocal, engine
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
from app.services.auth import PasswordResetDispatch

AuthModel = (
    type[User]
    | type[Workspace]
    | type[WorkspaceMembership]
    | type[WorkspaceInvitation]
    | type[RefreshToken]
    | type[PasswordResetToken]
)


class RecordingPasswordResetNotifier:
    def __init__(self) -> None:
        self.dispatches: list[PasswordResetDispatch] = []

    async def send(self, dispatch: PasswordResetDispatch) -> None:
        self.dispatches.append(dispatch)


async def _row_count(model: AuthModel) -> int:
    async with AsyncSessionLocal() as session:
        return int(await session.scalar(select(func.count()).select_from(model)) or 0)


async def _create_invitation(
    *,
    workspace_id: uuid.UUID,
    owner_id: uuid.UUID,
    email: str,
    raw_token: str,
) -> None:
    async with AsyncSessionLocal() as session:
        session.add(
            WorkspaceInvitation(
                workspace_id=workspace_id,
                email=email,
                role=WorkspaceRole.MEMBER,
                token_hash=hash_opaque_token(raw_token),
                invited_by_user_id=owner_id,
                expires_at=datetime.now(UTC) + timedelta(days=1),
            )
        )
        await session.commit()


async def _cleanup(emails: tuple[str, ...], workspace_slugs: tuple[str, ...]) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(delete(Workspace).where(Workspace.slug.in_(workspace_slugs)))
        await session.execute(delete(User).where(User.email.in_(emails)))
        await session.commit()


async def main() -> None:
    auth_models: tuple[AuthModel, ...] = (
        User,
        Workspace,
        WorkspaceMembership,
        WorkspaceInvitation,
        RefreshToken,
        PasswordResetToken,
    )
    if any([await _row_count(model) != 0 for model in auth_models]):
        raise RuntimeError("Real auth smoke test requires an empty development schema")

    run_id = uuid.uuid4().hex
    owner_emails = (
        f"auth-smoke-a-{run_id}@example.invalid",
        f"auth-smoke-b-{run_id}@example.invalid",
    )
    invited_email = f"auth-smoke-invited-{run_id}@example.invalid"
    workspace_slugs = (f"auth-smoke-a-{run_id}", f"auth-smoke-b-{run_id}")
    password = "SmokeTestPass123"
    new_password = "SmokeTestNewPass456"
    statuses: dict[str, int | bool] = {}

    try:
        smoke_settings = get_settings().model_copy(
            update={"jwt_secret": SecretStr(secrets.token_urlsafe(48))}
        )
        app = create_app(smoke_settings)
        app.dependency_overrides[get_settings] = lambda: smoke_settings
        notifier = RecordingPasswordResetNotifier()
        app.dependency_overrides[get_password_reset_notifier] = lambda: notifier
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            bootstrap_before = await client.get("/api/v1/auth/bootstrap-status")
            bootstrap_before.raise_for_status()
            statuses["bootstrap_before"] = bootstrap_before.json()["data"]["setup_required"]

            concurrent_transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=concurrent_transport,
                base_url="http://testserver",
            ) as concurrent_client:
                registration_responses = await asyncio.gather(
                    client.post(
                        "/api/v1/auth/register",
                        json={
                            "email": owner_emails[0],
                            "full_name": "Auth Smoke Test A",
                            "password": password,
                            "workspace_name": "Auth Smoke Workspace A",
                            "workspace_slug": workspace_slugs[0],
                        },
                    ),
                    concurrent_client.post(
                        "/api/v1/auth/register",
                        json={
                            "email": owner_emails[1],
                            "full_name": "Auth Smoke Test B",
                            "password": password,
                            "workspace_name": "Auth Smoke Workspace B",
                            "workspace_slug": workspace_slugs[1],
                        },
                    ),
                )
            assert sorted(response.status_code for response in registration_responses) == [201, 409]
            winner_index = next(
                index
                for index, response in enumerate(registration_responses)
                if response.status_code == 201
            )
            register = registration_responses[winner_index]
            email = owner_emails[winner_index]
            register.raise_for_status()
            statuses["register"] = register.status_code
            statuses["bootstrap_race_rejected"] = True
            register_data = register.json()["data"]
            register_access_token = register_data["access_token"]
            owner_id = uuid.UUID(register_data["user"]["id"])
            workspace_id = uuid.UUID(register_data["user"]["workspaces"][0]["id"])

            me = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {register_access_token}"},
            )
            me.raise_for_status()
            me_data = me.json()["data"]
            assert me_data["email"] == email
            assert me_data["workspaces"][0]["role"] == "owner"
            statuses["me"] = me.status_code

            login = await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            login.raise_for_status()
            statuses["login"] = login.status_code
            login_refresh_token = login.cookies.get("refresh_token")
            assert login_refresh_token is not None

            refresh = await client.post("/api/v1/auth/refresh")
            refresh.raise_for_status()
            statuses["refresh"] = refresh.status_code
            rotated_refresh_token = refresh.cookies.get("refresh_token")
            assert rotated_refresh_token is not None
            assert rotated_refresh_token != login_refresh_token
            statuses["refresh_rotated"] = True

            client.cookies.clear()
            client.cookies.set("refresh_token", login_refresh_token)
            reused_refresh = await client.post("/api/v1/auth/refresh")
            assert reused_refresh.status_code == 401
            statuses["old_refresh_rejected"] = True

            client.cookies.clear()
            client.cookies.set("refresh_token", rotated_refresh_token)
            logout = await client.post("/api/v1/auth/logout")
            logout.raise_for_status()
            statuses["logout"] = logout.status_code

            reset_session = await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            reset_session.raise_for_status()
            reset_session_refresh = reset_session.cookies.get("refresh_token")
            assert reset_session_refresh is not None

            invitation_token = secrets.token_urlsafe(48)
            await _create_invitation(
                workspace_id=workspace_id,
                owner_id=owner_id,
                email=invited_email,
                raw_token=invitation_token,
            )
            invitation_details = await client.get(
                f"/api/v1/auth/invitations/{invitation_token}"
            )
            invitation_details.raise_for_status()
            assert invitation_details.json()["data"]["email"] == invited_email
            statuses["invitation_details"] = invitation_details.status_code

            invited_registration = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": invited_email,
                    "full_name": "Invited Auth Smoke Test",
                    "password": password,
                    "invitation_token": invitation_token,
                },
            )
            invited_registration.raise_for_status()
            assert invited_registration.json()["data"]["user"]["workspaces"][0]["role"] == (
                "member"
            )
            statuses["invitation_register"] = invited_registration.status_code
            invitation_reuse = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": invited_email,
                    "full_name": "Invited Auth Smoke Test",
                    "password": password,
                    "invitation_token": invitation_token,
                },
            )
            assert invitation_reuse.status_code == 403
            statuses["invitation_reuse_rejected"] = True

            known_forgot = await client.post(
                "/api/v1/auth/password/forgot",
                json={"email": email},
            )
            unknown_forgot = await client.post(
                "/api/v1/auth/password/forgot",
                json={"email": f"missing-{run_id}@example.invalid"},
            )
            assert known_forgot.status_code == unknown_forgot.status_code == 202
            assert known_forgot.json() == unknown_forgot.json()
            assert len(notifier.dispatches) == 1
            statuses["forgot_privacy"] = True

            reset_token = notifier.dispatches[0].token
            password_reset = await client.post(
                "/api/v1/auth/password/reset",
                json={"token": reset_token, "new_password": new_password},
            )
            password_reset.raise_for_status()
            statuses["password_reset"] = password_reset.status_code
            reset_reuse = await client.post(
                "/api/v1/auth/password/reset",
                json={"token": reset_token, "new_password": new_password},
            )
            assert reset_reuse.status_code == 403
            statuses["reset_reuse_rejected"] = True

            client.cookies.clear()
            client.cookies.set("refresh_token", reset_session_refresh)
            revoked_session = await client.post("/api/v1/auth/refresh")
            assert revoked_session.status_code == 401
            statuses["reset_revoked_sessions"] = True

            old_password_login = await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            assert old_password_login.status_code == 401
            new_password_login = await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": new_password},
            )
            new_password_login.raise_for_status()
            statuses["new_password_login"] = new_password_login.status_code

            bootstrap_after = await client.get("/api/v1/auth/bootstrap-status")
            bootstrap_after.raise_for_status()
            statuses["bootstrap_after"] = bootstrap_after.json()["data"]["setup_required"]

        assert statuses["bootstrap_before"] is True
        assert statuses["bootstrap_after"] is False
        print(statuses)
    finally:
        await _cleanup((*owner_emails, invited_email), workspace_slugs)
        cleanup_counts = {
            model.__tablename__: await _row_count(model) for model in auth_models
        }
        print({"cleanup": cleanup_counts})
        if any(cleanup_counts.values()):
            raise RuntimeError("Real auth smoke test cleanup was incomplete")
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
