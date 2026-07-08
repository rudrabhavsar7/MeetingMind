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
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class MeetingSourceType(StrEnum):
    EXTENSION_CAPTURE = "extension_capture"
    STANDALONE_WEB_CAPTURE = "standalone_web_capture"
    RECORDING_IMPORT = "recording_import"
    BOT_JOIN = "bot_join"


class MeetingSourceApp(StrEnum):
    GOOGLE_MEET = "google_meet"
    ZOOM_WEB = "zoom_web"
    TEAMS_WEB = "teams_web"
    STANDALONE_WEB = "standalone_web"
    IMPORT = "import"


class ActionItemStatus(StrEnum):
    OPEN = "open"
    COMPLETED = "completed"
