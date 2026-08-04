/**
 * TanStack Query v5 hooks — meetings domain.
 * API contracts from: 02-engineering/jira-api-contracts.md
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Meeting,
  MeetingDetail,
  TranscriptSegment,
  ActionItem,
  Decision,
  PaginatedResponse,
  ApiResponse,
} from "@/types/api.types";

// ─── Query Keys ────────────────────────────────────────────────────────────

export const meetingKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...meetingKeys.lists(), workspaceId] as const,
  detail: (meetingId: string) =>
    [...meetingKeys.all, "detail", meetingId] as const,
  transcript: (meetingId: string) =>
    [...meetingKeys.all, "transcript", meetingId] as const,
  actionItems: (meetingId: string) =>
    [...meetingKeys.all, "action-items", meetingId] as const,
  decisions: (meetingId: string) =>
    [...meetingKeys.all, "decisions", meetingId] as const,
};

// ─── Meetings List ──────────────────────────────────────────────────────────

export interface MeetingsListParams {
  workspaceId: string;
  cursor?: string;
  limit?: number;
  status?: string;
}

async function fetchMeetings(
  params: MeetingsListParams
): Promise<PaginatedResponse<Meeting>> {
  const { workspaceId, cursor, limit = 20, status } = params;
  const { data } = await apiClient.get<PaginatedResponse<Meeting>>(
    `/workspaces/${workspaceId}/meetings`,
    { params: { cursor, limit, status } }
  );
  return data;
}

export function useMeetings(
  params: MeetingsListParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<Meeting>>>
) {
  return useQuery({
    queryKey: meetingKeys.list(params.workspaceId),
    queryFn: () => fetchMeetings(params),
    staleTime: 30_000,
    ...options,
  });
}

// ─── Meeting Detail ─────────────────────────────────────────────────────────

async function fetchMeeting(meetingId: string): Promise<Meeting> {
  const { data } = await apiClient.get<ApiResponse<Meeting>>(
    `/workspaces/default/meetings/${meetingId}`
  );
  return data.data;
}

export function useMeeting(
  meetingId: string | undefined,
  options?: Partial<UseQueryOptions<Meeting>>
) {
  return useQuery({
    queryKey: meetingKeys.detail(meetingId ?? ""),
    queryFn: () => fetchMeeting(meetingId!),
    enabled: !!meetingId,
    staleTime: 30_000,
    ...options,
  });
}

// ─── Transcript Segments ────────────────────────────────────────────────────

async function fetchTranscriptSegments(
  meetingId: string
): Promise<TranscriptSegment[]> {
  const { data } = await apiClient.get<PaginatedResponse<TranscriptSegment>>(
    `/meetings/${meetingId}/transcript`,
    { params: { limit: 500 } }
  );
  return data.data;
}

export function useTranscriptSegments(
  meetingId: string | undefined,
  options?: Partial<UseQueryOptions<TranscriptSegment[]>>
) {
  return useQuery({
    queryKey: meetingKeys.transcript(meetingId ?? ""),
    queryFn: () => fetchTranscriptSegments(meetingId!),
    enabled: !!meetingId,
    staleTime: 60_000,
    ...options,
  });
}

// ─── Action Items ───────────────────────────────────────────────────────────

async function fetchActionItems(meetingId: string): Promise<ActionItem[]> {
  const { data } = await apiClient.get<ApiResponse<ActionItem[]>>(
    `/meetings/${meetingId}/action-items`
  );
  return data.data;
}

export function useActionItems(
  meetingId: string | undefined,
  options?: Partial<UseQueryOptions<ActionItem[]>>
) {
  return useQuery({
    queryKey: meetingKeys.actionItems(meetingId ?? ""),
    queryFn: () => fetchActionItems(meetingId!),
    enabled: !!meetingId,
    staleTime: 30_000,
    ...options,
  });
}

// ─── Decisions ──────────────────────────────────────────────────────────────

async function fetchDecisions(meetingId: string): Promise<Decision[]> {
  const { data } = await apiClient.get<ApiResponse<Decision[]>>(
    `/meetings/${meetingId}/decisions`
  );
  return data.data;
}

export function useDecisions(
  meetingId: string | undefined,
  options?: Partial<UseQueryOptions<Decision[]>>
) {
  return useQuery({
    queryKey: meetingKeys.decisions(meetingId ?? ""),
    queryFn: () => fetchDecisions(meetingId!),
    enabled: !!meetingId,
    staleTime: 60_000,
    ...options,
  });
}

// ─── Patch Action Item ──────────────────────────────────────────────────────

interface PatchActionItemPayload {
  meetingId: string;
  itemId: string;
  status?: "open" | "completed";
  assignee?: string | null;
  due_date?: string | null;
  text?: string;
}

async function patchActionItem(
  payload: PatchActionItemPayload
): Promise<ActionItem> {
  const { meetingId, itemId, ...body } = payload;
  const { data } = await apiClient.patch<ApiResponse<ActionItem>>(
    `/meetings/${meetingId}/action-items/${itemId}`,
    body
  );
  return data.data;
}

export function usePatchActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchActionItem,
    onSuccess: (updated) => {
      // Optimistically update cached list
      qc.setQueryData<ActionItem[]>(
        meetingKeys.actionItems(updated.meeting_id),
        (prev) =>
          prev?.map((item) => (item.id === updated.id ? updated : item)) ?? []
      );
    },
  });
}

// ─── Soft-Delete Meeting ────────────────────────────────────────────────────

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      meetingId,
    }: {
      workspaceId: string;
      meetingId: string;
    }) => {
      await apiClient.delete(
        `/workspaces/${workspaceId}/meetings/${meetingId}`
      );
    },
    onSuccess: (_data, { workspaceId }) => {
      void qc.invalidateQueries({ queryKey: meetingKeys.list(workspaceId) });
    },
  });
}
