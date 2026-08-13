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
import type { ActionItem, PaginatedResponse } from "@/types/api.types";

// ─── Query Keys ────────────────────────────────────────────────────────────

export const workspaceKeys = {
  all: ["workspace"] as const,
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
