from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.auth import CurrentUserResponse


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)


class UserProfileUpdateEnvelope(BaseModel):
    data: CurrentUserResponse
