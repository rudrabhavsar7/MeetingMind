/**
 * TanStack Query v5 hooks — workspace domain.
 * API contracts from: 02-engineering/jira-api-contracts.md (MM-505)
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  ActionItem,
  ApiResponse,
  PaginatedResponse,
  WorkspaceRole,
} from "@/types/api.types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface WorkspaceMember {
  user_id: string;
  email: string;
  full_name: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: "pending" | "accepted" | "expired" | "revoked";
  created_at: string;
  expires_at: string;
}

// ─── Query Keys ────────────────────────────────────────────────────────────

export const workspaceKeys = {
  all: ["workspace"] as const,
  detail: (workspaceId: string) =>
    [...workspaceKeys.all, workspaceId] as const,
  members: (workspaceId: string) =>
    [...workspaceKeys.all, workspaceId, "members"] as const,
  invitations: (workspaceId: string) =>
    [...workspaceKeys.all, workspaceId, "invitations"] as const,
  actionItems: (workspaceId: string) =>
    [...workspaceKeys.all, workspaceId, "action-items"] as const,
};

// ─── Workspace-scoped Action Items (MM-505) ─────────────────────────────────

export interface WorkspaceActionItemsParams {
  workspaceId: string;
  cursor?: string;
  limit?: number;
  status?: "open" | "completed";
  assignee?: string;
  meeting_id?: string;
}

async function fetchWorkspaceActionItems(
  params: WorkspaceActionItemsParams
): Promise<PaginatedResponse<ActionItem>> {
  const { workspaceId, ...rest } = params;
  const { data } = await apiClient.get<PaginatedResponse<ActionItem>>(
    `/workspaces/${workspaceId}/action-items`,
    { params: rest }
  );
  return data;
}

export function useWorkspaceActionItems(
  params: WorkspaceActionItemsParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<ActionItem>>>
) {
  return useQuery({
    queryKey: workspaceKeys.actionItems(params.workspaceId),
    queryFn: () => fetchWorkspaceActionItems(params),
    staleTime: 30_000,
    ...options,
  });
}

// ─── Patch workspace-level action item (re-uses same endpoint) ──────────────

interface PatchActionItemPayload {
  workspaceId: string;
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
  const { data } = await apiClient.patch<{ data: ActionItem }>(
    `/meetings/${meetingId}/action-items/${itemId}`,
    body
  );
  return data.data;
}

export function usePatchWorkspaceActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchActionItem,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: workspaceKeys.actionItems(payload.workspaceId) });
      qc.setQueriesData<PaginatedResponse<ActionItem>>(
        { queryKey: workspaceKeys.actionItems(payload.workspaceId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) =>
              item.id === payload.itemId ? { ...item, status: payload.status ?? item.status } : item
            ),
          };
        }
      );
    },
    onSettled: (_data, _error, variables) => {
      void qc.invalidateQueries({
        queryKey: workspaceKeys.actionItems(variables.workspaceId),
      });
    },
  });
}

// ─── Workspace Members ─────────────────────────────────────────────────────

async function fetchWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const { data } = await apiClient.get<ApiResponse<WorkspaceMember[]>>(
    `/workspaces/${workspaceId}/members`
  );
  return data.data;
}

export function useWorkspaceMembers(
  workspaceId: string | undefined,
  options?: Partial<UseQueryOptions<WorkspaceMember[]>>
) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
    ...options,
  });
}

// ─── Workspace Detail ──────────────────────────────────────────────────────

async function fetchWorkspaceDetail(
  workspaceId: string
): Promise<import("@/types/api.types").Workspace> {
  const { data } = await apiClient.get<
    ApiResponse<import("@/types/api.types").Workspace>
  >(`/workspaces/${workspaceId}`);
  return data.data;
}

export function useWorkspaceDetail(
  workspaceId: string | undefined,
  options?: Partial<UseQueryOptions<import("@/types/api.types").Workspace>>
) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceDetail(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
    ...options,
  });
}

// ─── Pending Invitations ───────────────────────────────────────────────────

async function fetchWorkspaceInvitations(
  workspaceId: string
): Promise<WorkspaceInvitation[]> {
  const { data } = await apiClient.get<ApiResponse<WorkspaceInvitation[]>>(
    `/workspaces/${workspaceId}/invitations`
  );
  return data.data;
}

export function useWorkspaceInvitations(
  workspaceId: string | undefined,
  options?: Partial<UseQueryOptions<WorkspaceInvitation[]>>
) {
  return useQuery({
    queryKey: workspaceKeys.invitations(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceInvitations(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
    ...options,
  });
}

// ─── Send Invitation ───────────────────────────────────────────────────────

interface SendInvitationPayload {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}

async function sendInvitation(
  payload: SendInvitationPayload
): Promise<WorkspaceInvitation> {
  const { workspaceId, ...body } = payload;
  const { data } = await apiClient.post<ApiResponse<WorkspaceInvitation>>(
    `/workspaces/${workspaceId}/invitations`,
    body
  );
  return data.data;
}

export function useSendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendInvitation,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: workspaceKeys.invitations(variables.workspaceId),
      });
    },
  });
}

// ─── Revoke Invitation ─────────────────────────────────────────────────────

interface RevokeInvitationPayload {
  workspaceId: string;
  invitationId: string;
}

async function revokeInvitation(payload: RevokeInvitationPayload): Promise<void> {
  const { workspaceId, invitationId } = payload;
  await apiClient.delete(
    `/workspaces/${workspaceId}/invitations/${invitationId}`
  );
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: workspaceKeys.invitations(variables.workspaceId),
      });
    },
  });
}
