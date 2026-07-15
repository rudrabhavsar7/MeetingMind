from functools import lru_cache
from typing import Annotated, Literal, Self

from pydantic import AnyUrl, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MeetingMind API"
    version: str = "0.1.0"
    env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    database_url: str = "postgresql+asyncpg://meetingmind:meetingmind@localhost:5432/meetingmind"
    redis_url: str = "redis://localhost:6379/0"
    storage_endpoint: AnyUrl | None = None
    storage_bucket: str = "meetingmind"
    jwt_secret: SecretStr = SecretStr("change-me")
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    refresh_cookie_name: str = "refresh_token"
    frontend_url: str = "http://localhost:3000"
    password_reset_notifier: Literal["disabled", "smtp"] = "disabled"
    smtp_host: str | None = None
    smtp_port: int = 1025
    smtp_starttls: bool = False
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from_email: str | None = None
    smtp_timeout_seconds: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="MEETINGMIND_",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @model_validator(mode="after")
    def validate_security_settings(self) -> Self:
        if self.env in {"staging", "production"}:
            secret = self.jwt_secret.get_secret_value()
            known_placeholders = {"change-me", "change-me-in-local-env"}
            if len(secret.encode("utf-8")) < 32 or secret in known_placeholders:
                raise ValueError(
                    "MEETINGMIND_JWT_SECRET must contain at least 32 bytes of generated entropy "
                    "in staging and production"
                )

        if self.password_reset_notifier == "smtp":
            missing = [
                name
                for name, value in {
                    "MEETINGMIND_SMTP_HOST": self.smtp_host,
                    "MEETINGMIND_SMTP_FROM_EMAIL": self.smtp_from_email,
                }.items()
                if not value
            ]
            if missing:
                raise ValueError(
                    "SMTP password-reset delivery requires " + ", ".join(missing)
                )
            if (self.smtp_username is None) != (self.smtp_password is None):
                raise ValueError(
                    "MEETINGMIND_SMTP_USERNAME and MEETINGMIND_SMTP_PASSWORD must be set together"
                )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
