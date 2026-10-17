import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildConsoleUrl,
  buildConsoleLoginUrl,
  canResumeSocketDrain,
  cleanupFailedCaptureStart,
  heartbeatTimedOut,
  normalizeApiBaseUrl,
  sessionLimitReached,
  shouldPauseSocketDrain,
} from '../src/capture/session-lifecycle.ts';

test('console login URL does not point at the local API server', () => {
  assert.equal(buildConsoleLoginUrl('http://localhost:8000/api/v1'), 'http://localhost/login');
  assert.equal(buildConsoleLoginUrl('https://meetings.example/api/v1'), 'https://meetings.example/login');
});

test('console links use configured console origin and support meeting paths', () => {
  assert.equal(buildConsoleUrl('http://localhost:8000/api/v1', '/dashboard'), 'http://localhost/dashboard');
  assert.equal(buildConsoleUrl('http://localhost:8000/api/v1', '/meetings/meeting-1'), 'http://localhost/meetings/meeting-1');
  assert.equal(buildConsoleUrl('https://meetings.example/api/v1', '/meetings/meeting-1'), 'https://meetings.example/meetings/meeting-1');
});

test('socket drain pauses at high watermark and resumes below low watermark', () => {
  assert.equal(shouldPauseSocketDrain(256 * 1024), true);
  assert.equal(canResumeSocketDrain(64 * 1024), true);
  assert.equal(canResumeSocketDrain(64 * 1024 + 1), false);
});

test('heartbeat timeout and eight-hour duration have explicit boundaries', () => {
  assert.equal(heartbeatTimedOut(1_000, 45_999), false);
  assert.equal(heartbeatTimedOut(1_000, 46_000), true);
  assert.equal(sessionLimitReached(28_800_000, 28_800_000), true);
});

test('API origin permission is specific and remote HTTP or credentials are rejected', () => {
  assert.deepEqual(normalizeApiBaseUrl('https://meetings.example/api/v1/'), {
    baseUrl: 'https://meetings.example/api/v1',
    originPattern: 'https://meetings.example/*',
  });
  assert.equal(normalizeApiBaseUrl('http://localhost:8000/api/v1').originPattern, 'http://localhost/*');
  assert.throws(() => normalizeApiBaseUrl('http://meetings.example/api/v1'), /HTTPS/);
  assert.throws(() => normalizeApiBaseUrl('https://user:pass@meetings.example/api/v1'), /credentials/);
});

test('failed offscreen startup ends its created meeting and clears local active capture', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  let cleared = false;
  const ended = await cleanupFailedCaptureStart(
    { apiBaseUrl: 'https://meetings.example/api/v1', workspaceId: 'w1', meetingId: 'm1', extensionSessionToken: 'ext-token' },
    async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(null, { status: 200 });
    },
    async () => { cleared = true; },
  );

  assert.equal(ended, true);
  assert.equal(requestUrl, 'https://meetings.example/api/v1/workspaces/w1/meetings/m1/end');
  assert.equal(requestInit?.method, 'POST');
  assert.equal(requestInit?.headers && new Headers(requestInit.headers).get('Authorization'), 'Bearer ext-token');
  assert.equal(JSON.parse(String(requestInit?.body)).reason, 'startup_failed');
  assert.equal(cleared, true);
});

test('failed meeting finalization still clears the stale active capture', async () => {
  let cleared = false;
  const ended = await cleanupFailedCaptureStart(
    { apiBaseUrl: 'https://meetings.example/api/v1', workspaceId: 'w1', meetingId: 'm1', extensionSessionToken: 'ext-token' },
    async () => { throw new Error('network down'); },
    async () => { cleared = true; },
  );

  assert.equal(ended, false);
  assert.equal(cleared, true);
});
