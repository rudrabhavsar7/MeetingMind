from enum import StrEnum
from typing import TypeVar

EnumType = TypeVar("EnumType", bound=StrEnum)


def enum_values(enum_type: type[EnumType]) -> list[str]:
    return [member.value for member in enum_type]


class WorkspaceRole(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class MeetingStatus(StrEnum):
    SCHEDULED = "scheduled"
    RECORDING = "recording"
    PAUSED = "paused"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class MeetingSourceType(StrEnum):
    EXTENSION_CAPTURE = "extension_capture"
    STANDALONE_WEB_CAPTURE = "standalone_web_capture"
    RECORDING_IMPORT = "recording_import"


class MeetingSourceApp(StrEnum):
    GOOGLE_MEET = "google_meet"
    ZOOM_WEB = "zoom_web"
    TEAMS_WEB = "teams_web"
    STANDALONE_WEB = "standalone_web"
    IMPORT = "import"


class ActionItemStatus(StrEnum):
    OPEN = "open"
    COMPLETED = "completed"


class MediaKind(StrEnum):
    IMPORT = "import"
    LIVE_AUDIO = "live_audio"
    EXTRACTED_AUDIO = "extracted_audio"
    EXPORT = "export"
    AVATAR = "avatar"


class MediaStatus(StrEnum):
    PENDING = "pending"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    DELETED = "deleted"
    FAILED = "failed"


class AIProcessingStage(StrEnum):
    SUMMARY = "summary"
    ACTION_ITEMS = "action_items"
    DECISIONS = "decisions"
    EMBEDDING = "embedding"
    RAG = "rag"


class AIProcessingMode(StrEnum):
    ROLLING = "rolling"
    FINAL = "final"
    BATCH = "batch"
    BACKFILL = "backfill"


class ProcessingStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SummaryKind(StrEnum):
    ROLLING = "rolling"
    FINAL = "final"
    USER_EDITED = "user_edited"


class SummaryStatus(StrEnum):
    DRAFT = "draft"
    CURRENT = "current"
    SUPERSEDED = "superseded"


class OutputOrigin(StrEnum):
    AI = "ai"
    USER = "user"


class FeedbackRating(StrEnum):
    UP = "up"
    DOWN = "down"
