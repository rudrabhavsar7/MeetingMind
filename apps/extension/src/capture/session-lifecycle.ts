export const SOCKET_HIGH_WATER_BYTES = 256 * 1024;
export const SOCKET_LOW_WATER_BYTES = 64 * 1024;
export const HEARTBEAT_INTERVAL_MS = 15_000;
export const HEARTBEAT_TIMEOUT_MS = 45_000;

export function shouldPauseSocketDrain(bufferedAmount: number): boolean {
  return bufferedAmount >= SOCKET_HIGH_WATER_BYTES;
}

export function canResumeSocketDrain(bufferedAmount: number): boolean {
  return bufferedAmount <= SOCKET_LOW_WATER_BYTES;
}

export function heartbeatTimedOut(lastServerActivityAt: number, now: number): boolean {
  return now - lastServerActivityAt >= HEARTBEAT_TIMEOUT_MS;
}

export function sessionLimitReached(elapsedMs: number, limitMs: number): boolean {
  return elapsedMs >= limitMs;
}

export function normalizeApiBaseUrl(value: string): { baseUrl: string; originPattern: string } {
  const parsed = new URL(value.trim());
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('API URL cannot contain credentials, query, or fragment.');
  }
  const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocalhost)) {
    throw new Error('Use HTTPS for remote MeetingMind servers. HTTP is allowed only for localhost.');
  }
  const baseUrl = `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  return { baseUrl, originPattern: `${parsed.protocol}//${parsed.hostname}/*` };
}

export function buildConsoleLoginUrl(apiBaseUrl: string): string {
  return buildConsoleUrl(apiBaseUrl, '/login');
}

export function buildConsoleUrl(apiBaseUrl: string, path: string): string {
  const parsed = new URL(apiBaseUrl);
  const isLocalApi = (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.port === '8000';
  if (isLocalApi) parsed.port = '';
  parsed.pathname = path.startsWith('/') ? path : `/${path}`;
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString();
}

export interface FailedCaptureSession {
  apiBaseUrl: string;
  workspaceId: string;
  meetingId: string;
  extensionSessionToken: string;
}

export async function cleanupFailedCaptureStart(
  capture: FailedCaptureSession,
  fetcher: typeof fetch,
  clearActiveCapture: () => Promise<void>,
): Promise<boolean> {
  let ended = false;
  try {
    const response = await fetcher(
      `${capture.apiBaseUrl}/workspaces/${encodeURIComponent(capture.workspaceId)}/meetings/${encodeURIComponent(capture.meetingId)}/end`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${capture.extensionSessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ended_at: new Date().toISOString(), reason: 'startup_failed' }),
      },
    );
    ended = response.ok;
  } catch {
    ended = false;
  } finally {
    await clearActiveCapture();
  }
  return ended;
}
