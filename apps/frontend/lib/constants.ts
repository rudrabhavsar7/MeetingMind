/**
 * Global constants for the MeetingMind frontend.
 *
 * Never hardcode secrets or private endpoints here.
 * Sensitive values must come from environment variables (prefixed NEXT_PUBLIC_).
 */

export const APP_NAME = "MeetingMind" as const;

/** Base URL for the MeetingMind FastAPI backend. Defaults to localhost for local dev. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** API version prefix — matches backend /api/v1 routing. */
export const API_V1_PREFIX = "/api/v1" as const;

/** Full versioned API URL. */
export const API_URL = `${API_BASE_URL}${API_V1_PREFIX}` as const;

/** Maximum reading width for transcript views (per design spec). */
export const TRANSCRIPT_MAX_WIDTH = "80ch" as const;

/** Dashboard max content width. */
export const DASHBOARD_MAX_WIDTH = "max-w-7xl" as const;
