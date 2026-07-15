from __future__ import annotations

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_PATTERN.match(email):
        raise ValueError("Enter a valid email address.")
    return email


def _validate_password(value: str) -> str:
    if not any(character.isdigit() for character in value):
        raise ValueError("Password must contain at least one number.")
    return value


class RegisterRequest(BaseModel):
    email: str
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    workspace_name: str | None = Field(default=None, min_length=1, max_length=255)
    workspace_slug: str | None = Field(default=None, min_length=1, max_length=255)
    invitation_token: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)

    @model_validator(mode="after")
    def validate_registration_mode(self) -> RegisterRequest:
        if self.invitation_token is not None and (
            self.workspace_name is not None or self.workspace_slug is not None
        ):
            raise ValueError("Workspace fields are not accepted with an invitation token.")
        return self


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)


class PasswordResetRequest(BaseModel):
    token: str = Field(min_length=1, max_length=512)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class WorkspaceSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str


class CurrentUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    workspaces: list[WorkspaceSummary] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CurrentUserEnvelope(BaseModel):
    data: CurrentUserResponse


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserResponse


class AuthTokenEnvelope(BaseModel):
    data: AuthTokenResponse


class StatusResponse(BaseModel):
    status: str


class StatusEnvelope(BaseModel):
    data: StatusResponse


class BootstrapStatus(BaseModel):
    setup_required: bool
    registration_mode: str


class BootstrapStatusResponse(BaseModel):
    data: BootstrapStatus


class InvitationDetails(BaseModel):
    workspace_name: str
    email: str
    role: str
    expires_at: datetime


class InvitationDetailsEnvelope(BaseModel):
    data: InvitationDetails
