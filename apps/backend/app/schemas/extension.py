import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExtensionConnectRequest(BaseModel):
    workspace_id: uuid.UUID
    extension_version: str = Field(..., min_length=1)
    browser: str = Field(..., min_length=1)
    permissions_granted: list[str]


class WorkspaceSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class ExtensionConnectResponse(BaseModel):
    extension_token: str
    expires_at: datetime
    workspace: WorkspaceSummary
    event_schema_version: str = "1.0"


class ExtensionConnectEnvelope(BaseModel):
    data: ExtensionConnectResponse


class AudioChunkMs(BaseModel):
    min: int
    max: int
    recommended: int


class ExtensionCapabilitiesResponse(BaseModel):
    supported_apps: list[str]
    fast_follow_apps: list[str]
    audio_chunk_ms: AudioChunkMs
    raw_audio_retention_days: int | None
    standalone_web_capture_enabled: bool
    recording_import_enabled: bool
    event_schema_version: str


class ExtensionCapabilitiesEnvelope(BaseModel):
    data: ExtensionCapabilitiesResponse


class ActiveTab(BaseModel):
    source_app: str
    source_url: str
    source_title: str
    is_supported: bool


class ExtensionHeartbeatRequest(BaseModel):
    workspace_id: uuid.UUID
    active_tab: ActiveTab | None = None
    status: str


class ExtensionHeartbeatResponse(BaseModel):
    status: str
    server_time: datetime


class ExtensionHeartbeatEnvelope(BaseModel):
    data: ExtensionHeartbeatResponse
