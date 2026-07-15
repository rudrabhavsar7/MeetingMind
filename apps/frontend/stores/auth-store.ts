import { create } from "zustand";
import { apiClient, clearAccessToken, setAccessToken } from "@/lib/api";
import type {
  ApiResponse,
  AuthSession,
  BootstrapStatus,
  User,
} from "@/types/api.types";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  workspace_name: string;
  workspace_slug: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  getBootstrapStatus: () => Promise<BootstrapStatus>;
  logout: () => Promise<void>;
  hydrateFromSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<ApiResponse<AuthSession>>(
        "/auth/login",
        { email, password }
      );
      setAccessToken(data.data.access_token);
      set({ user: data.data.user, isLoading: false });
    } catch (error: unknown) {
      set({ error: errorMessage(error, "Login failed. Please check your credentials."), isLoading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<ApiResponse<AuthSession>>(
        "/auth/register",
        payload
      );
      setAccessToken(data.data.access_token);
      set({ user: data.data.user, isLoading: false });
    } catch (error: unknown) {
      set({ error: errorMessage(error, "Registration failed. Please try again."), isLoading: false });
      throw error;
    }
  },

  getBootstrapStatus: async () => {
    const { data } = await apiClient.get<ApiResponse<BootstrapStatus>>(
      "/auth/bootstrap-status"
    );
    return data.data;
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearAccessToken();
      set({ user: null, isLoading: false, error: null });
    }
  },

  hydrateFromSession: async () => {
    set({ isLoading: true });
    try {
      const { data: refreshData } = await apiClient.post<ApiResponse<AuthSession>>(
        "/auth/refresh"
      );
      setAccessToken(refreshData.data.access_token);
      const { data: userData } = await apiClient.get<ApiResponse<User>>("/auth/me");
      set({ user: userData.data, isLoading: false });
    } catch {
      clearAccessToken();
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }
  const response = (error as { response?: { data?: unknown } }).response;
  if (typeof response?.data !== "object" || response.data === null) return fallback;
  const detail = (response.data as Record<string, unknown>).detail;
  return typeof detail === "string" ? detail : fallback;
}
