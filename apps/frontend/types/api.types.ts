/**
 * Shared TypeScript types for MeetingMind API responses.
 * These mirror the Pydantic schemas in apps/backend/app/schemas/.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

// ─── Workspaces ───────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  raw_audio_retention_days: number | null;
}

// ─── Meetings ─────────────────────────────────────────────────────────────

export type MeetingStatus =
  | "recording"
  | "transcribing"
  | "analyzing"
  | "completed"
  | "failed";

export interface Meeting {
  id: string;
  workspace_id: string;
  title: string;
  status: MeetingStatus;
  source_app: string | null;
  source_url: string | null;
  duration_seconds: number | null;
  participant_count: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  summary_preview: string | null;
}

export interface MeetingDetail extends Meeting {
  summary: string | null;
  action_items: ActionItem[];
  decisions: Decision[];
  transcript_segments: TranscriptSegment[];
}

// ─── Transcript ───────────────────────────────────────────────────────────

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  speaker_label: string;
  speaker_name: string | null;
  text: string;
  start_time: number; // seconds from meeting start
  end_time: number;
  created_at: string;
}

// ─── Action Items ─────────────────────────────────────────────────────────

export type ActionItemStatus = "open" | "completed";

export interface ActionItem {
  id: string;
  meeting_id: string;
  text: string;
  assignee: string | null;
  due_date: string | null;
  status: ActionItemStatus;
  source_segment_id: string | null;
  created_at: string;
}

// ─── Decisions ────────────────────────────────────────────────────────────

export interface Decision {
  id: string;
  meeting_id: string;
  text: string;
  source_segment_id: string | null;
  created_at: string;
}

// ─── RAG / Chat ───────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Citation {
  index: number;
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  segment_text: string;
  start_time: number;
}

// ─── API Envelope ─────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
    limit: number;
  };
}
