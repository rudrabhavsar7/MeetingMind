from functools import lru_cache

from pydantic import AnyUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MeetingMind API"
    version: str = "0.1.0"
    env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    database_url: str = "postgresql+asyncpg://meetingmind:meetingmind@localhost:5432/meetingmind"
    redis_url: str = "redis://localhost:6379/0"
    storage_endpoint: AnyUrl | None = None
    storage_bucket: str = "meetingmind"
    jwt_secret: SecretStr = SecretStr("change-me")

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
