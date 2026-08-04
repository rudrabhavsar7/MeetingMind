/**
 * TanStack Query v5 hooks — Ask AI / RAG chat (MM-604 / MM-605).
 * API contracts from: 02-engineering/jira-api-contracts.md (MM-603)
 */

import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ChatMessage, Citation } from "@/types/api.types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AskAIRequest {
  workspaceId: string;
  query: string;
}

export interface AskAIResponse {
  answer: string;
  citations: Citation[];
  conversation_id?: string;
}

// ─── Query Keys ────────────────────────────────────────────────────────────

export const chatKeys = {
  all: ["chat"] as const,
  history: (workspaceId: string, conversationId: string) =>
    [...chatKeys.all, workspaceId, conversationId] as const,
};

// ─── Ask AI Mutation ────────────────────────────────────────────────────────

async function askAI(payload: AskAIRequest): Promise<AskAIResponse> {
  const { workspaceId, query } = payload;
  const { data } = await apiClient.post<{ data: AskAIResponse }>(
    `/workspaces/${workspaceId}/ai/chat`,
    { query }
  );
  return data.data;
}

export function useAskAI() {
  return useMutation({
    mutationFn: askAI,
  });
}

// ─── Chat History (optional) ────────────────────────────────────────────────

async function fetchChatHistory(
  workspaceId: string,
  conversationId: string
): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<{ data: ChatMessage[] }>(
    `/workspaces/${workspaceId}/ai/chat/${conversationId}`
  );
  return data.data;
}

export function useChatHistory(
  workspaceId: string,
  conversationId: string | undefined,
  options?: Partial<UseQueryOptions<ChatMessage[]>>
) {
  return useQuery({
    queryKey: chatKeys.history(workspaceId, conversationId ?? ""),
    queryFn: () => fetchChatHistory(workspaceId, conversationId!),
    enabled: !!conversationId,
    staleTime: 60_000,
    ...options,
  });
}
