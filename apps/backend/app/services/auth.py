from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    TokenClaims,
    TokenError,
    create_access_token,
    decode_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models import RefreshToken, User


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


@dataclass(frozen=True, slots=True)
class AuthSession:
    user: User
    access_token: str
    refresh_token: str
    refresh_expires_at: datetime


class AuthRepository(Protocol):
    async def get_user_by_email(self, email: str) -> User | None: ...

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None: ...

    async def create_user(self, *, email: str, full_name: str, password_hash: str) -> User: ...

    async def create_refresh_token(
        self,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken: ...

    async def get_refresh_token(self, token_hash: str) -> RefreshToken | None: ...

    async def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        *,
        replaced_by_token_id: uuid.UUID | None = None,
    ) -> None: ...


class SqlAlchemyAuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self._session.get(User, user_id)

    async def create_user(self, *, email: str, full_name: str, password_hash: str) -> User:
        user = User(email=email, full_name=full_name, password_hash=password_hash)
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return user

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

    async def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        *,
        replaced_by_token_id: uuid.UUID | None = None,
    ) -> None:
        refresh_token.revoked_at = datetime.now(UTC)
        refresh_token.replaced_by_token_id = replaced_by_token_id
        await self._session.commit()


class AuthService:
    def __init__(self, repository: AuthRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    async def register(self, *, email: str, full_name: str, password: str) -> AuthSession:
        existing_user = await self._repository.get_user_by_email(email)
        if existing_user is not None:
            raise DuplicateEmailError("Email is already registered")

        user = await self._repository.create_user(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
        )
        return await self._issue_session(user)

    async def login(self, *, email: str, password: str) -> AuthSession:
        user = await self._repository.get_user_by_email(email)
        if user is None or user.password_hash is None:
            raise InvalidCredentialsError("Invalid email or password")
        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")
        return await self._issue_session(user)

    async def refresh(self, refresh_token: str) -> AuthSession:
        stored_token = await self._get_valid_refresh_token(refresh_token)
        user = await self._repository.get_user_by_id(stored_token.user_id)
        if user is None:
            raise InvalidRefreshTokenError("Refresh token user does not exist")

        session = await self._issue_session(user)
        new_token_hash = hash_refresh_token(session.refresh_token)
        new_stored_token = await self._repository.get_refresh_token(new_token_hash)
        await self._repository.revoke_refresh_token(
            stored_token,
            replaced_by_token_id=new_stored_token.id if new_stored_token else None,
        )
        return session

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
        if user is None:
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
        access_token = create_access_token(
            subject=user.id,
            secret=self._settings.jwt_secret.get_secret_value(),
            algorithm=self._settings.jwt_algorithm,
            expires_delta=timedelta(minutes=self._settings.access_token_minutes),
        )
        return AuthSession(
            user=user,
            access_token=access_token,
            refresh_token=refresh_token,
            refresh_expires_at=refresh_expires_at,
        )

    async def _get_valid_refresh_token(self, refresh_token: str) -> RefreshToken:
        stored_token = await self._repository.get_refresh_token(hash_refresh_token(refresh_token))
        if stored_token is None:
            raise InvalidRefreshTokenError("Refresh token is invalid")
        if stored_token.revoked_at is not None:
            raise InvalidRefreshTokenError("Refresh token has been revoked")
        if stored_token.expires_at <= datetime.now(UTC):
            raise InvalidRefreshTokenError("Refresh token has expired")
        return stored_token

    def _decode_access_token(self, access_token: str) -> TokenClaims:
        return decode_token(
            token=access_token,
            secret=self._settings.jwt_secret.get_secret_value(),
            algorithm=self._settings.jwt_algorithm,
            expected_type="access",
        )
