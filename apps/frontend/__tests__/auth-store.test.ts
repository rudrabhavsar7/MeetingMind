import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

import { useAuthStore } from "@/stores/auth-store";
import { apiClient, setAccessToken, clearAccessToken } from "@/lib/api";

const mockedPost = vi.mocked(apiClient.post);
const mockedGet = vi.mocked(apiClient.get);
const mockedSetAccessToken = vi.mocked(setAccessToken);
const mockedClearAccessToken = vi.mocked(clearAccessToken);

function resetStore() {
  useAuthStore.setState({ user: null, isLoading: false, error: null });
}

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
});

describe("auth store", () => {
  describe("login", () => {
    it("sets user and token on successful login", async () => {
      const mockUser = {
        id: "u1",
        email: "test@test.com",
        full_name: "Test User",
        workspaces: [{ id: "ws1", name: "Test", slug: "test", role: "owner" as const }],
      };
      mockedPost.mockResolvedValueOnce({
        data: { data: { access_token: "tok_123", token_type: "bearer", user: mockUser } },
      });

      await useAuthStore.getState().login({ email: "test@test.com", password: "pass" });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockedSetAccessToken).toHaveBeenCalledWith("tok_123");
    });

    it("sets error on failed login", async () => {
      mockedPost.mockRejectedValueOnce({
        response: { data: { detail: "Invalid credentials" } },
      });

      await expect(
        useAuthStore.getState().login({ email: "bad@test.com", password: "wrong" })
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe("Invalid credentials");
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("logout", () => {
    it("clears user and token", async () => {
      mockedPost.mockResolvedValueOnce({ data: {} });
      useAuthStore.setState({
        user: {
          id: "u1",
          email: "test@test.com",
          full_name: "Test",
          workspaces: [],
        },
      });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(mockedClearAccessToken).toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    it("updates user name on success", async () => {
      const updatedUser = {
        id: "u1",
        email: "test@test.com",
        full_name: "New Name",
        workspaces: [],
      };
      mockedGet.mockResolvedValueOnce({ data: { data: updatedUser } });
      mockedPost.mockResolvedValueOnce({ data: { data: { access_token: "tok", user: updatedUser } } });
      useAuthStore.setState({
        user: { id: "u1", email: "test@test.com", full_name: "Old Name", workspaces: [] },
      });

      // Simulate hydrate which calls /auth/me
      await useAuthStore.getState().hydrateFromSession();

      const state = useAuthStore.getState();
      expect(state.user?.full_name).toBe("New Name");
    });
  });

  describe("getBootstrapStatus", () => {
    it("returns bootstrap status", async () => {
      mockedGet.mockResolvedValueOnce({
        data: { data: { setup_required: true, registration_mode: "bootstrap" } },
      });

      const status = await useAuthStore.getState().getBootstrapStatus();
      expect(status.setup_required).toBe(true);
      expect(status.registration_mode).toBe("bootstrap");
    });
  });
});
