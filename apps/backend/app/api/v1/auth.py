from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.session import get_db_session
from app.models import User
from app.schemas.auth import (
    AuthTokenResponse,
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    StatusResponse,
)
from app.services.auth import (
    AuthService,
    DuplicateEmailError,
    InvalidAccessTokenError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    SqlAlchemyAuthRepository,
)

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(SqlAlchemyAuthRepository(session), settings)


def _current_user_response(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(id=user.id, email=user.email, full_name=user.full_name)


def _set_refresh_cookie(response: Response, settings: Settings, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.env == "production",
        samesite="lax",
    )


def _auth_response(user: User, access_token: str) -> AuthTokenResponse:
    return AuthTokenResponse(access_token=access_token, user=_current_user_response(user))


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthTokenResponse:
    try:
        session = await auth_service.register(
            email=payload.email,
            full_name=payload.full_name,
            password=payload.password,
        )
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from exc

    _set_refresh_cookie(response, settings, session.refresh_token)
    return _auth_response(session.user, session.access_token)


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthTokenResponse:
    try:
        session = await auth_service.login(email=payload.email, password=payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        ) from exc

    _set_refresh_cookie(response, settings, session.refresh_token)
    return _auth_response(session.user, session.access_token)


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> AuthTokenResponse:
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    try:
        session = await auth_service.refresh(refresh_token)
    except InvalidRefreshTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from exc

    _set_refresh_cookie(response, settings, session.refresh_token)
    return _auth_response(session.user, session.access_token)


@router.post("/logout", response_model=StatusResponse)
async def logout(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> StatusResponse:
    await auth_service.logout(refresh_token)
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        httponly=True,
        secure=settings.env == "production",
        samesite="lax",
    )
    return StatusResponse(status="ok")


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    try:
        return await auth_service.get_current_user(credentials.credentials)
    except InvalidAccessTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        ) from exc


@router.get("/me", response_model=CurrentUserResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> CurrentUserResponse:
    return _current_user_response(current_user)
