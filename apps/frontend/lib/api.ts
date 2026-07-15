"use client";

import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, API_V1_PREFIX } from "@/lib/constants";
import type { ApiResponse, AuthSession } from "@/types/api.types";

/**
 * In-memory access token store.
 * Per authentication.md: access tokens MUST NOT be stored in localStorage
 * or sessionStorage — only in memory to mitigate XSS.
 */
let accessToken = "";

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getAccessToken(): string {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = "";
}

/**
 * Axios instance for all MeetingMind API calls.
 * Base URL reads from NEXT_PUBLIC_API_BASE_URL env variable.
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  withCredentials: true, // Required for HttpOnly refresh_token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor — inject the in-memory access token into every request.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response interceptor — transparently retry after a 401 by refreshing the
 * access token using the HttpOnly refresh_token cookie.
 *
 * Per authentication.md §4 — the browser automatically attaches the
 * refresh_token cookie on the /auth/refresh request.
 */
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processPendingQueue(err: unknown, token: string): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err) {
      reject(err);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const isCredentialEndpoint = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/password/forgot",
      "/auth/password/reset",
    ].some((path) => originalRequest.url?.endsWith(path));

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isCredentialEndpoint
    ) {
      if (isRefreshing) {
        // Queue additional 401s until the refresh completes
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<AuthSession>>(
          `${API_BASE_URL}${API_V1_PREFIX}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.data.access_token);
        processPendingQueue(null, data.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processPendingQueue(refreshError, "");
        clearAccessToken();
        // Redirect to login — refresh token is invalid or expired
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
