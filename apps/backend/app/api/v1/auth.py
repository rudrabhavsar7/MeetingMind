from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.session import get_db_session
from app.models import User
from app.schemas.auth import (
    AuthTokenEnvelope,
    AuthTokenResponse,
    BootstrapStatus,
    BootstrapStatusResponse,
    CurrentUserEnvelope,
    CurrentUserResponse,
    ForgotPasswordRequest,
    InvitationDetails,
    InvitationDetailsEnvelope,
    LoginRequest,
    PasswordResetRequest,
    RegisterRequest,
    StatusEnvelope,
    StatusResponse,
)
from app.services.auth import (
    AuthService,
    BootstrapClosedError,
    DuplicateEmailError,
    InvalidAccessTokenError,
    InvalidCredentialsError,
    InvalidInvitationError,
    InvalidPasswordResetTokenError,
    InvalidRefreshTokenError,
    SqlAlchemyAuthRepository,
)
from app.services.notifications import PasswordResetNotifier, build_password_reset_notifier

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_password_reset_notifier(
    settings: Annotated[Settings, Depends(get_settings)],
) -> PasswordResetNotifier:
    return build_password_reset_notifier(settings)


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(SqlAlchemyAuthRepository(session), settings)


def _current_user_response(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        workspaces=[
            {
                "id": membership.workspace.id,
                "name": membership.workspace.name,
                "slug": membership.workspace.slug,
                "role": membership.role.value,
            }
            for membership in user.memberships
            if membership.workspace.deleted_at is None
        ],
    )


def _set_refresh_cookie(response: Response, settings: Settings, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.env == "production",
        samesite="strict",
    )


def _auth_response(user: User, access_token: str) -> AuthTokenResponse:
    return AuthTokenResponse(access_token=access_token, user=_current_user_response(user))


@router.get("/bootstrap-status", response_model=BootstrapStatusResponse)
async def bootstrap_status(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> BootstrapStatusResponse:
    setup_required = await auth_service.bootstrap_required()
    return BootstrapStatusResponse(
        data=BootstrapStatus(
            setup_required=setup_required,
            registration_mode="bootstrap" if setup_required else "invitation_only",
        )
    )


@router.get("/invitations/{token}", response_model=InvitationDetailsEnvelope)
async def invitation_details(
    token: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> InvitationDetailsEnvelope:
    try:
        invitation = await auth_service.get_invitation(token)
    except InvalidInvitationError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid invitation",
        ) from exc
    return InvitationDetailsEnvelope(
        data=InvitationDetails(
            workspace_name=invitation.workspace_name,
            email=invitation.email,
            role=invitation.role.value,
            expires_at=invitation.expires_at,
        )
    )


@router.post("/register", response_model=AuthTokenEnvelope, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthTokenEnvelope:
    try:
        session = await auth_service.register(
            email=payload.email,
            full_name=payload.full_name,
            password=payload.password,
            workspace_name=payload.workspace_name,
            workspace_slug=payload.workspace_slug,
            invitation_token=payload.invitation_token,
        )
    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from exc
    except InvalidInvitationError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid invitation",
        ) from exc
    except BootstrapClosedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration requires a valid invitation",
        ) from exc

    _set_refresh_cookie(response, settings, session.refresh_token)
    return AuthTokenEnvelope(data=_auth_response(session.user, session.access_token))


@router.post(
    "/password/forgot",
    response_model=StatusEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    notifier: Annotated[PasswordResetNotifier, Depends(get_password_reset_notifier)],
) -> StatusEnvelope:
    dispatch = await auth_service.request_password_reset(payload.email)
    if dispatch is not None:
        background_tasks.add_task(notifier.send, dispatch)
    return StatusEnvelope(data=StatusResponse(status="accepted"))


@router.post("/password/reset", response_model=StatusEnvelope)
async def reset_password(
    payload: PasswordResetRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> StatusEnvelope:
    try:
        await auth_service.reset_password(
            token=payload.token,
            new_password=payload.new_password,
        )
    except InvalidPasswordResetTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid password reset token",
        ) from exc
    return StatusEnvelope(data=StatusResponse(status="password_reset"))


@router.post("/login", response_model=AuthTokenEnvelope)
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthTokenEnvelope:
    try:
        session = await auth_service.login(email=payload.email, password=payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        ) from exc

    _set_refresh_cookie(response, settings, session.refresh_token)
    return AuthTokenEnvelope(data=_auth_response(session.user, session.access_token))


@router.post("/refresh", response_model=AuthTokenEnvelope)
async def refresh(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> AuthTokenEnvelope:
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
    return AuthTokenEnvelope(data=_auth_response(session.user, session.access_token))


@router.post("/logout", response_model=StatusEnvelope)
async def logout(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> StatusEnvelope:
    await auth_service.logout(refresh_token)
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        httponly=True,
        secure=settings.env == "production",
        samesite="strict",
    )
    return StatusEnvelope(data=StatusResponse(status="ok"))


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


@router.get("/me", response_model=CurrentUserEnvelope)
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> CurrentUserEnvelope:
    return CurrentUserEnvelope(data=_current_user_response(current_user))
