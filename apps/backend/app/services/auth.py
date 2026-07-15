from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Protocol

from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings
from app.core.security import (
    TokenClaims,
    TokenError,
    create_access_token,
    decode_token,
    generate_opaque_token,
    generate_refresh_token,
    hash_opaque_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models import (
    PasswordResetToken,
    RefreshToken,
    User,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMembership,
    WorkspaceRole,
)


class AuthError(ValueError):
    pass


class DuplicateEmailError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


class InvalidRefreshTokenError(AuthError):
    pass


class InvalidAccessTokenError(AuthError):
    pass


class InvalidInvitationError(AuthError):
    pass


class InvalidPasswordResetTokenError(AuthError):
    pass


class BootstrapClosedError(AuthError):
    pass


@dataclass(frozen=True, slots=True)
class AuthSession:
    user: User
    access_token: str
    refresh_token: str
    refresh_expires_at: datetime


@dataclass(frozen=True, slots=True)
class InvitationSummary:
    workspace_name: str
    email: str
    role: WorkspaceRole
    expires_at: datetime


@dataclass(frozen=True, slots=True)
class PasswordResetDispatch:
    email: str
    token: str
    expires_at: datetime


class AuthRepository(Protocol):
    async def has_users(self) -> bool: ...

    async def get_user_by_email(self, email: str) -> User | None: ...

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None: ...

    async def bootstrap_owner(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        workspace_name: str,
        workspace_slug: str,
    ) -> User: ...

    async def get_invitation_summary(self, token_hash: str) -> InvitationSummary | None: ...

    async def register_with_invitation(
        self,
        *,
        token_hash: str,
        email: str,
        full_name: str,
        password_hash: str,
    ) -> User: ...

    async def create_refresh_token(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken: ...

    async def get_refresh_token(self, token_hash: str) -> RefreshToken | None: ...

    async def rotate_refresh_token(
        self,
        *,
        current_token_hash: str,
        replacement_token_hash: str,
        replacement_expires_at: datetime,
    ) -> tuple[User, RefreshToken]: ...

    async def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        *,
        replaced_by_token_id: uuid.UUID | None = None,
    ) -> None: ...

    async def replace_password_reset_token(
        self,
        *,
        email: str,
        token_hash: str,
        expires_at: datetime,
    ) -> bool: ...

    async def reset_password(self, *, token_hash: str, password_hash: str) -> None: ...


def _invitation_is_active(invitation: WorkspaceInvitation, now: datetime) -> bool:
    return (
        invitation.accepted_at is None
        and invitation.revoked_at is None
        and invitation.expires_at > now
    )


def _password_reset_is_active(reset_token: PasswordResetToken, now: datetime) -> bool:
    return (
        reset_token.used_at is None
        and reset_token.revoked_at is None
        and reset_token.expires_at > now
    )


class SqlAlchemyAuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def has_users(self) -> bool:
        result = await self._session.execute(select(User.id).limit(1))
        return result.scalar_one_or_none() is not None

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.memberships).selectinload(WorkspaceMembership.workspace))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._session.execute(
            select(User)
            .options(selectinload(User.memberships).selectinload(WorkspaceMembership.workspace))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def bootstrap_owner(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
        workspace_name: str,
        workspace_slug: str,
    ) -> User:
        async with self._session.begin():
            await self._session.execute(
                text("SELECT pg_advisory_xact_lock(hashtext('meetingmind_bootstrap'))")
            )
            if await self.has_users():
                raise BootstrapClosedError("Bootstrap has already completed")
            user = User(email=email, full_name=full_name, password_hash=password_hash)
            workspace = Workspace(
                name=workspace_name,
                slug=workspace_slug,
                is_default=True,
            )
            membership = WorkspaceMembership(
                user=user,
                workspace=workspace,
                role=WorkspaceRole.OWNER,
            )
            self._session.add_all([user, workspace, membership])
            await self._session.flush()
        return user

    async def get_invitation_summary(self, token_hash: str) -> InvitationSummary | None:
        result = await self._session.execute(
            select(WorkspaceInvitation)
            .options(selectinload(WorkspaceInvitation.workspace))
            .where(WorkspaceInvitation.token_hash == token_hash)
        )
        invitation = result.scalar_one_or_none()
        if invitation is None or not _invitation_is_active(invitation, datetime.now(UTC)):
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
        try:
            async with self._session.begin():
                result = await self._session.execute(
                    select(WorkspaceInvitation)
                    .options(selectinload(WorkspaceInvitation.workspace))
                    .where(WorkspaceInvitation.token_hash == token_hash)
                    .with_for_update()
                )
                invitation = result.scalar_one_or_none()
                now = datetime.now(UTC)
                if (
                    invitation is None
                    or not _invitation_is_active(invitation, now)
                    or invitation.email != email
                ):
                    raise InvalidInvitationError("Invitation is invalid")

                existing_user = await self._session.scalar(
                    select(User.id).where(User.email == email).limit(1)
                )
                if existing_user is not None:
                    raise DuplicateEmailError("Email is already registered")

                user = User(email=email, full_name=full_name, password_hash=password_hash)
                membership = WorkspaceMembership(
                    user=user,
                    workspace=invitation.workspace,
                    role=invitation.role,
                )
                invitation.accepted_at = now
                self._session.add_all([user, membership])
                await self._session.flush()
            return user
        except IntegrityError as exc:
            raise DuplicateEmailError("Email is already registered") from exc

    async def create_refresh_token(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(refresh_token)
        await self._session.commit()
        await self._session.refresh(refresh_token)
        return refresh_token

    async def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        result = await self._session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def rotate_refresh_token(
        self,
        *,
        current_token_hash: str,
        replacement_token_hash: str,
        replacement_expires_at: datetime,
    ) -> tuple[User, RefreshToken]:
        async with self._session.begin():
            result = await self._session.execute(
                select(RefreshToken)
                .where(RefreshToken.token_hash == current_token_hash)
                .with_for_update()
            )
            current_token = result.scalar_one_or_none()
            now = datetime.now(UTC)
            if (
                current_token is None
                or current_token.revoked_at is not None
                or current_token.expires_at <= now
            ):
                raise InvalidRefreshTokenError("Refresh token is invalid")

            user_result = await self._session.execute(
                select(User)
                .options(selectinload(User.memberships).selectinload(WorkspaceMembership.workspace))
                .where(User.id == current_token.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user is None or not user.is_active or user.deleted_at is not None:
                raise InvalidRefreshTokenError("Refresh token user is invalid")

            replacement = RefreshToken(
                user_id=user.id,
                token_hash=replacement_token_hash,
                expires_at=replacement_expires_at,
            )
            self._session.add(replacement)
            await self._session.flush()
            current_token.revoked_at = now
            current_token.replaced_by_token_id = replacement.id
        return user, replacement

    async def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        *,
        replaced_by_token_id: uuid.UUID | None = None,
    ) -> None:
        refresh_token.revoked_at = datetime.now(UTC)
        refresh_token.replaced_by_token_id = replaced_by_token_id
        await self._session.commit()

    async def replace_password_reset_token(
        self,
        *,
        email: str,
        token_hash: str,
        expires_at: datetime,
    ) -> bool:
        async with self._session.begin():
            user = await self._session.scalar(
                select(User)
                .where(
                    User.email == email,
                    User.is_active.is_(True),
                    User.deleted_at.is_(None),
                )
                .with_for_update()
            )
            if user is None:
                return False

            now = datetime.now(UTC)
            await self._session.execute(
                update(PasswordResetToken)
                .where(
                    PasswordResetToken.user_id == user.id,
                    PasswordResetToken.used_at.is_(None),
                    PasswordResetToken.revoked_at.is_(None),
                )
                .values(revoked_at=now)
            )
            self._session.add(
                PasswordResetToken(
                    user_id=user.id,
                    token_hash=token_hash,
                    expires_at=expires_at,
                )
            )
        return True

    async def reset_password(self, *, token_hash: str, password_hash: str) -> None:
        async with self._session.begin():
            reset_token = await self._session.scalar(
                select(PasswordResetToken)
                .where(PasswordResetToken.token_hash == token_hash)
                .with_for_update()
            )
            now = datetime.now(UTC)
            if reset_token is None or not _password_reset_is_active(reset_token, now):
                raise InvalidPasswordResetTokenError("Password reset token is invalid")

            user = await self._session.scalar(
                select(User).where(User.id == reset_token.user_id).with_for_update()
            )
            if user is None or not user.is_active or user.deleted_at is not None:
                raise InvalidPasswordResetTokenError("Password reset token is invalid")

            user.password_hash = password_hash
            reset_token.used_at = now
            await self._session.execute(
                update(PasswordResetToken)
                .where(
                    PasswordResetToken.user_id == user.id,
                    PasswordResetToken.id != reset_token.id,
                    PasswordResetToken.used_at.is_(None),
                    PasswordResetToken.revoked_at.is_(None),
                )
                .values(revoked_at=now)
            )
            await self._session.execute(
                update(RefreshToken)
                .where(
                    RefreshToken.user_id == user.id,
                    RefreshToken.revoked_at.is_(None),
                )
                .values(revoked_at=now)
            )


class AuthService:
    def __init__(self, repository: AuthRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    async def bootstrap_required(self) -> bool:
        return not await self._repository.has_users()

    async def get_invitation(self, invitation_token: str) -> InvitationSummary:
        invitation = await self._repository.get_invitation_summary(
            hash_opaque_token(invitation_token)
        )
        if invitation is None:
            raise InvalidInvitationError("Invitation is invalid")
        return invitation

    async def register(
        self,
        *,
        email: str,
        full_name: str,
        password: str,
        workspace_name: str | None,
        workspace_slug: str | None,
        invitation_token: str | None,
    ) -> AuthSession:
        password_hash = hash_password(password)
        if invitation_token is not None:
            user = await self._repository.register_with_invitation(
                token_hash=hash_opaque_token(invitation_token),
                email=email,
                full_name=full_name,
                password_hash=password_hash,
            )
            return await self._issue_session(user)

        if workspace_name is None or workspace_slug is None:
            raise BootstrapClosedError("Bootstrap workspace is required")
        user = await self._repository.bootstrap_owner(
            email=email,
            full_name=full_name,
            password_hash=password_hash,
            workspace_name=workspace_name,
            workspace_slug=workspace_slug,
        )
        return await self._issue_session(user)

    async def request_password_reset(self, email: str) -> PasswordResetDispatch | None:
        token = generate_opaque_token()
        expires_at = datetime.now(UTC) + timedelta(minutes=30)
        created = await self._repository.replace_password_reset_token(
            email=email,
            token_hash=hash_opaque_token(token),
            expires_at=expires_at,
        )
        if not created:
            return None
        return PasswordResetDispatch(email=email, token=token, expires_at=expires_at)

    async def reset_password(self, *, token: str, new_password: str) -> None:
        await self._repository.reset_password(
            token_hash=hash_opaque_token(token),
            password_hash=hash_password(new_password),
        )

    async def login(self, *, email: str, password: str) -> AuthSession:
        user = await self._repository.get_user_by_email(email)
        if (
            user is None
            or user.password_hash is None
            or not user.is_active
            or user.deleted_at is not None
            or not verify_password(password, user.password_hash)
        ):
            raise InvalidCredentialsError("Invalid email or password")
        return await self._issue_session(user)

    async def refresh(self, refresh_token: str) -> AuthSession:
        replacement_token = generate_refresh_token()
        replacement_expires_at = datetime.now(UTC) + timedelta(
            days=self._settings.refresh_token_days
        )
        user, _ = await self._repository.rotate_refresh_token(
            current_token_hash=hash_refresh_token(refresh_token),
            replacement_token_hash=hash_refresh_token(replacement_token),
            replacement_expires_at=replacement_expires_at,
        )
        return AuthSession(
            user=user,
            access_token=self._create_access_token(user),
            refresh_token=replacement_token,
            refresh_expires_at=replacement_expires_at,
        )

    async def logout(self, refresh_token: str | None) -> None:
        if refresh_token is None:
            return
        stored_token = await self._repository.get_refresh_token(hash_refresh_token(refresh_token))
        if stored_token is not None and stored_token.revoked_at is None:
            await self._repository.revoke_refresh_token(stored_token)

    async def get_current_user(self, access_token: str) -> User:
        try:
            claims = self._decode_access_token(access_token)
        except TokenError as exc:
            raise InvalidAccessTokenError("Access token is invalid") from exc

        user = await self._repository.get_user_by_id(claims.subject)
        if user is None or not user.is_active or user.deleted_at is not None:
            raise InvalidAccessTokenError("Access token user does not exist")
        return user

    async def _issue_session(self, user: User) -> AuthSession:
        refresh_token = generate_refresh_token()
        refresh_expires_at = datetime.now(UTC) + timedelta(days=self._settings.refresh_token_days)
        await self._repository.create_refresh_token(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_expires_at,
        )
        return AuthSession(
            user=user,
            access_token=self._create_access_token(user),
            refresh_token=refresh_token,
            refresh_expires_at=refresh_expires_at,
        )

    def _create_access_token(self, user: User) -> str:
        return create_access_token(
            subject=user.id,
            secret=self._settings.jwt_secret.get_secret_value(),
            algorithm=self._settings.jwt_algorithm,
            expires_delta=timedelta(minutes=self._settings.access_token_minutes),
        )

    def _decode_access_token(self, access_token: str) -> TokenClaims:
        return decode_token(
            token=access_token,
            secret=self._settings.jwt_secret.get_secret_value(),
            algorithm=self._settings.jwt_algorithm,
            expected_type="access",
        )
