import { create } from "zustand";
import { apiClient, setAccessToken, clearAccessToken } from "@/lib/api";

/** Shape of the authenticated user returned from GET /auth/me */
interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

interface AuthState {
  /** Currently authenticated user — null when unauthenticated. */
  user: AuthUser | null;
  /** True while an auth network request is in-flight. */
  isLoading: boolean;
  /** Populated when a login/register/logout operation fails. */
  error: string | null;

  /** Log in with email + password. Stores access token in memory. */
  login: (payload: LoginPayload) => Promise<void>;
  /** Register a new account and auto-login. */
  register: (payload: RegisterPayload) => Promise<void>;
  /** Log out — clears in-memory token and calls the backend to revoke refresh. */
  logout: () => Promise<void>;
  /** Hydrate the store from an existing session (called on app boot). */
  hydrateFromSession: () => Promise<void>;
  /** Clear any transient error message. */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<{
        access_token: string;
        user: AuthUser;
      }>("/auth/login", { email, password });

      setAccessToken(data.access_token);
      set({ user: data.user, isLoading: false });
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && hasErrorMessage(err.response?.data)
          ? err.response!.data.error.message
          : "Login failed. Please check your credentials.";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async ({ email, password, full_name }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<{
        access_token: string;
        user: AuthUser;
      }>("/auth/register", { email, password, full_name });

      setAccessToken(data.access_token);
      set({ user: data.user, isLoading: false });
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && hasErrorMessage(err.response?.data)
          ? err.response!.data.error.message
          : "Registration failed. Please try again.";
      set({ error: message, isLoading: false });
      throw err;
    }
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
      // Attempt to get a new access token using the HttpOnly refresh cookie.
      const { data: refreshData } = await apiClient.post<{
        access_token: string;
      }>("/auth/refresh");
      setAccessToken(refreshData.access_token);

      // Fetch the current user profile.
      const { data: userData } = await apiClient.get<{ data: AuthUser }>(
        "/auth/me"
      );
      set({ user: userData.data, isLoading: false });
    } catch {
      // No valid session — user needs to log in.
      clearAccessToken();
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

/** Narrow type guard for Axios errors (avoids importing AxiosError type at runtime). */
function isAxiosError(
  err: unknown
): err is { response?: { data?: unknown }; message: string } {
  return typeof err === "object" && err !== null && "response" in err;
}

/** Narrow type guard for the API RFC-7807 error envelope. */
function hasErrorMessage(
  data: unknown
): data is { error: { message: string } } {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as Record<string, unknown>).error === "object" &&
    typeof ((data as Record<string, unknown>).error as Record<string, unknown>).message === "string"
  );
}
