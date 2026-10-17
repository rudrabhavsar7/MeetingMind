/// <reference types="chrome"/>

import { isTrustedExtensionSender } from './capture/message-policy';
import type { GoogleMeetPageContext, VisibleParticipantContext } from './capture/meeting-context';
import { buildPipelineEventsUrl } from './capture/stream-protocol';
import { buildConsoleLoginUrl, cleanupFailedCaptureStart, normalizeApiBaseUrl } from './capture/session-lifecycle';
import { getActiveTabStreamId } from './capture/tab-capture';

// Keep access tokens and active extension-session credentials out of content scripts.
const storageAccessReady = chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });

const trustedStorage = {
  get: async (keys: string[]) => {
    await storageAccessReady;
    return chrome.storage.local.get(keys);
  },
  set: async (items: Parameters<typeof chrome.storage.local.set>[0]) => {
    await storageAccessReady;
    return chrome.storage.local.set(items);
  },
  remove: async (keys: string | string[]) => {
    await storageAccessReady;
    return chrome.storage.local.remove(keys);
  },
};

let currentMeetingId = "";
let currentWorkspaceId = "";

function trustedSender(sender: chrome.runtime.MessageSender): boolean {
  return isTrustedExtensionSender(sender.url, chrome.runtime.getURL(''));
}

function sendOffscreen<T>(type: string, payload?: unknown): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ target: 'offscreen', type, payload }, (response: T | undefined) => {
      if (chrome.runtime.lastError) resolve(undefined);
      else resolve(response);
    });
  });
}

async function beginCaptureIdentity(workspaceId: string): Promise<string> {
  const clientInstanceId = crypto.randomUUID();
  await trustedStorage.set({ activeCapture: { workspaceId, clientInstanceId } });
  return clientInstanceId;
}

// Handle the toolbar action explicitly to grant activeTab. Open synchronously:
// awaiting setOptions first loses the user gesture required by sidePanel.open.
void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return;
  void chrome.sidePanel.open({ tabId: tab.id }).catch((error: unknown) => {
    console.error('Could not open MeetingMind panel:', error);
  });
});

async function setupOffscreenDocument(path: string) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contextTypes: ['OFFSCREEN_DOCUMENT' as any],
    documentUrls: [offscreenUrl]
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existingContexts as any)?.length > 0) return;
  await chrome.offscreen.createDocument({
    url: path,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reasons: ['USER_MEDIA' as any],
    justification: 'Recording meeting audio for MeetingMind'
  });
}

function readMeetPageContext(tabId: number): Promise<(GoogleMeetPageContext & { url: string }) | undefined> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'GET_MEETING_INFO' }, (response: unknown) => {
        if (chrome.runtime.lastError || !response || typeof response !== 'object') {
          resolve(undefined);
          return;
        }
        const context = response as Partial<GoogleMeetPageContext> & { url?: unknown };
        const participants = Array.isArray(context.visible_participants)
          ? context.visible_participants as VisibleParticipantContext[]
          : [];
        resolve({
          title: typeof context.title === 'string' ? context.title : null,
          visible_participants: participants,
          url: typeof context.url === 'string' ? context.url : '',
        });
      });
    } catch {
      // Metadata is optional; a tab messaging error must not block capture.
      resolve(undefined);
    }
  });
}

async function resolveAuth(apiBaseUrl: string): Promise<{
  authenticated: boolean;
  token?: string;
  workspaceId?: string;
  workspaceName?: string;
}> {
  const storage = await trustedStorage.get(['extensionToken', 'workspaceId', 'workspaceName']);
  let token = storage.extensionToken;
  let workspaceId = storage.workspaceId;
  let workspaceName = storage.workspaceName;

  // 1. If we have a token, verify it via /auth/me
  if (token) {
    try {
      const resp = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        const workspaces = data.data?.workspaces;
        if (workspaces && workspaces.length > 0) {
          workspaceId = workspaces[0].id;
          workspaceName = workspaces[0].name;
          await trustedStorage.set({ workspaceId, workspaceName });
          return { authenticated: true, token, workspaceId, workspaceName };
        }
      }
    } catch (e) {
      console.warn('Failed to verify token with /auth/me:', e);
    }
  }

  // 2. If token missing or /auth/me failed (e.g. 401 expired), attempt session refresh
  try {
    const refreshResp = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    if (refreshResp.ok) {
      const refreshData = await refreshResp.json();
      token = refreshData.data?.access_token;
      const workspaces = refreshData.data?.user?.workspaces;
      if (token && workspaces && workspaces.length > 0) {
        workspaceId = workspaces[0].id;
        workspaceName = workspaces[0].name;
        await trustedStorage.set({
          extensionToken: token,
          workspaceId,
          workspaceName,
        });
        return { authenticated: true, token, workspaceId, workspaceName };
      }
    }
  } catch (e) {
    console.warn('Failed to refresh session:', e);
  }

  // 3. If we still have a cached workspaceId and token (offline fallback), return them
  if (token && workspaceId) {
    return { authenticated: true, token, workspaceId, workspaceName };
  }

  // 4. Otherwise, not authenticated — clear stale values
  await trustedStorage.remove(['extensionToken', 'workspaceId', 'workspaceName']);
  return { authenticated: false };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'offscreen' || message.target === 'ui') return false;
  const privileged = ['LOGIN', 'GET_AUTH_STATUS', 'LOGOUT', 'SET_TOKEN', 'SET_API_BASE_URL', 'START_CAPTURE', 'REQUEST_NEW_STREAM_TOKEN', 'REQUEST_PIPELINE_SOCKET', 'STOP_CAPTURE', 'PAUSE_CAPTURE', 'RESUME_CAPTURE', 'GET_CAPTURE_STATUS', 'OPEN_MIC_PERMISSION_PAGE'];
  if (privileged.includes(message.type) && !trustedSender(sender)) {
    sendResponse({ status: 'error', error: 'Untrusted extension sender.' });
    return false;
  }
  if (message.type === 'LOGIN') {
    (async () => {
      try {
        const storage = await trustedStorage.get(['apiBaseUrl']);
        const apiBaseUrl = storage.apiBaseUrl || 'http://localhost:8000/api/v1';
        await chrome.tabs.create({ url: buildConsoleLoginUrl(apiBaseUrl) });
        sendResponse({ status: 'opened' });
      } catch (err) {
        sendResponse({ status: 'error', error: err instanceof Error ? err.message : String(err) });
      }
    })();
    return true;
  }

  if (message.type === 'OPEN_MIC_PERMISSION_PAGE') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') }).then(() => {
      sendResponse({ status: 'opened' });
    }).catch((error: unknown) => {
      sendResponse({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  }

  if (message.type === 'GET_AUTH_STATUS') {
    (async () => {
      const storage = await trustedStorage.get(['apiBaseUrl', 'extensionDeviceId']);
      const apiBaseUrl = storage.apiBaseUrl || "http://localhost:8000/api/v1";
      const extensionDeviceId = typeof storage.extensionDeviceId === 'string'
        ? storage.extensionDeviceId
        : crypto.randomUUID();
      if (storage.extensionDeviceId !== extensionDeviceId) {
        await trustedStorage.set({ extensionDeviceId });
      }
      const auth = await resolveAuth(apiBaseUrl);
      sendResponse({ ...auth, apiBaseUrl, extensionDeviceId });
    })();
    return true;
  }

  if (message.type === 'SET_API_BASE_URL') {
    (async () => {
      try {
        const { baseUrl, originPattern } = normalizeApiBaseUrl(String(message.payload?.baseUrl ?? ''));
        const granted = await chrome.permissions.contains({ origins: [originPattern] });
        if (!granted) {
          sendResponse({ status: 'error', error: 'Grant this server origin in the extension settings first.' });
          return;
        }
        await trustedStorage.set({ apiBaseUrl: baseUrl });
        sendResponse({ status: 'ok', apiBaseUrl: baseUrl });
      } catch (error) {
        sendResponse({ status: 'error', error: error instanceof Error ? error.message : 'Invalid server URL.' });
      }
    })();
    return true;
  }

  if (message.type === 'LOGOUT') {
    void trustedStorage.remove(['extensionToken', 'workspaceId', 'workspaceName', 'activeCapture']).then(() => {
      sendResponse({ status: 'logged_out' });
    });
    return true;
  }

  if (message.type === 'SET_TOKEN') {
    (async () => {
      const { token } = message.payload;
      await trustedStorage.set({ extensionToken: token });
      const storage = await trustedStorage.get(['apiBaseUrl']);
      const apiBaseUrl = storage.apiBaseUrl || "http://localhost:8000/api/v1";
      try {
        const resp = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          const workspaces = data.data?.workspaces;
          if (workspaces && workspaces.length > 0) {
            const wsId = workspaces[0].id;
            const wsName = workspaces[0].name;
            await trustedStorage.set({ workspaceId: wsId, workspaceName: wsName });
            sendResponse({ status: 'ok', workspaceId: wsId, workspaceName: wsName });
            return;
          }
        }
        sendResponse({ status: 'ok', workspaceId: null });
      } catch (e) {
        sendResponse({ status: 'ok', workspaceId: null });
      }
    })();
    return true;
  }

  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.sidePanel.open({ tabId }).then(() => {
          sendResponse({ status: 'opened' });
        }).catch((err) => {
          sendResponse({ status: 'error', error: err.message });
        });
      }
    });
    return true;
  }

  if (message.type === 'START_CAPTURE') {
    (async () => {
      let failedStartSession: { apiBaseUrl: string; workspaceId: string; meetingId: string; extensionSessionToken: string } | null = null;
      try {
        const { workspaceId, title, url, tabId } = message.payload;
        currentWorkspaceId = workspaceId;

        if (!url || !url.includes('meet.google.com')) {
          sendResponse({ status: 'error', error: 'Please switch to the Google Meet tab before starting capture.' });
          return;
        }
        if (!Number.isInteger(tabId)) throw new Error('Active Meet tab is unavailable.');

        const pageContext = await readMeetPageContext(tabId);
        const sourceTitle = (pageContext?.title?.trim() || title.trim()).slice(0, 255);
        const sourceUrlCandidate = pageContext?.url || url;
        const sourceUrl = sourceUrlCandidate.length <= 2048 ? sourceUrlCandidate : undefined;
        const visibleParticipants = pageContext?.visible_participants ?? [];

        const storage = await trustedStorage.get(['extensionToken', 'apiBaseUrl']);
        const token = storage.extensionToken;
        const apiBaseUrl = storage.apiBaseUrl || "http://localhost:8000/api/v1";

        const grantedPermissions = await chrome.permissions.getAll();
        const connectResponse = await fetch(`${apiBaseUrl}/extension/connect`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspaceId,
            extension_version: chrome.runtime.getManifest().version,
            browser: 'chrome',
            permissions_granted: grantedPermissions.permissions || [],
          }),
        });
        if (!connectResponse.ok) throw new Error("Failed to establish extension session");
        const connectJson = await connectResponse.json();
        const extensionSessionToken = connectJson.data.extension_token as string;
        if (!extensionSessionToken) throw new Error("Extension session token missing");

        const existing = await trustedStorage.get(['activeCapture']);
        const savedCapture = existing.activeCapture as { clientInstanceId?: string } | undefined;
        const clientInstanceId = savedCapture?.clientInstanceId ?? await beginCaptureIdentity(workspaceId);

        const response = await fetch(`${apiBaseUrl}/workspaces/${workspaceId}/meetings/live`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${extensionSessionToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_type: "chrome_extension",
            source_type: "extension_capture",
            source_app: "google_meet",
            source_url: sourceUrl,
            source_title: sourceTitle || undefined,
            visible_participants: visibleParticipants,
            client_instance_id: clientInstanceId,
            started_at: new Date().toISOString()
          })
        });

        if (!response.ok) throw new Error("Failed to start meeting on backend");

        const json = await response.json();
        const { stream_url, stream_token, meeting } = json.data;
        currentMeetingId = meeting.id;
        failedStartSession = { apiBaseUrl, workspaceId, meetingId: currentMeetingId, extensionSessionToken };
        await trustedStorage.set({
          activeCapture: {
            workspaceId,
            meetingId: currentMeetingId,
            clientInstanceId,
            extensionSessionToken,
            startedAt: new Date().toISOString(),
            title: sourceTitle || 'Live Meeting',
            url: sourceUrl || url,
          },
        });

        await setupOffscreenDocument('offscreen.html');

        const streamId = await getActiveTabStreamId({
          getMediaStreamId: () => new Promise<string>((resolve, reject) => {
            chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
              const error = chrome.runtime.lastError;
              if (error) reject(new Error(error.message));
              else resolve(id);
            });
          }),
        });

        const startResult = await sendOffscreen<{ status: string; error?: string }>('START_STREAM', {
          streamId, token: stream_token, url: stream_url, id: currentMeetingId, clientInstanceId, workspaceId,
        });
        if (!startResult || startResult.status !== 'ok') throw new Error(startResult?.error ?? 'Could not start offscreen audio capture.');
        sendResponse({ status: 'started', meetingId: currentMeetingId });
      } catch (err) {
        await sendOffscreen('STOP_STREAM');
        if (failedStartSession) {
          const ended = await cleanupFailedCaptureStart(
            failedStartSession,
            fetch,
            () => trustedStorage.remove('activeCapture'),
          );
          if (!ended) console.error('Failed capture meeting cleanup did not complete.');
          currentMeetingId = '';
          currentWorkspaceId = '';
        }
        console.error('Capture startup failed:', err instanceof Error ? err.name : 'unknown error');
        sendResponse({ status: 'error', error: err instanceof Error ? err.message : String(err) });
      }
    })();
    return true;
  }
  
  if (message.type === 'REQUEST_NEW_STREAM_TOKEN') {
    (async () => {
      try {
        const storage = await trustedStorage.get(['apiBaseUrl', 'activeCapture']);
        const apiBaseUrl = storage.apiBaseUrl || "http://localhost:8000/api/v1";
        const activeCapture = storage.activeCapture as { workspaceId?: string; meetingId?: string; clientInstanceId?: string; extensionSessionToken?: string } | undefined;
        const workspaceId = currentWorkspaceId || activeCapture?.workspaceId;
        const clientInstanceId = message.clientInstanceId || activeCapture?.clientInstanceId;
        const extensionSessionToken = activeCapture?.extensionSessionToken;
        if (!workspaceId || !clientInstanceId || !extensionSessionToken || activeCapture?.meetingId !== message.meetingId) {
          sendResponse({ token: null });
          return;
        }

        const response = await fetch(`${apiBaseUrl}/workspaces/${workspaceId}/meetings/${message.meetingId}/stream-token`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${extensionSessionToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_instance_id: clientInstanceId, last_acknowledged_sequence: message.lastAcknowledgedSequence ?? -1 })
        });

        if (response.ok) {
          const json = await response.json();
          sendResponse({ token: json.data.stream_token, url: json.data.stream_url });
        } else {
          sendResponse({ token: null });
        }
      } catch (err) {
        sendResponse({ token: null });
      }
    })();
    return true;
  }

  if (message.type === 'REQUEST_PIPELINE_SOCKET') {
    (async () => {
      const storage = await trustedStorage.get(['apiBaseUrl', 'extensionToken', 'activeCapture']);
      const activeCapture = storage.activeCapture as { workspaceId?: string; meetingId?: string } | undefined;
      const meetingId = String(message.meetingId ?? '');
      const workspaceId = String(message.workspaceId ?? '');
      if (!workspaceId || !meetingId || activeCapture?.meetingId !== meetingId || activeCapture.workspaceId !== workspaceId) {
        sendResponse({ token: null, url: null });
        return;
      }
      const apiBaseUrl = String(storage.apiBaseUrl || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
      const auth = await resolveAuth(apiBaseUrl);
      if (!auth.authenticated || !auth.token || auth.workspaceId !== workspaceId) {
        sendResponse({ token: null, url: null });
        return;
      }
      sendResponse({ token: auth.token, url: buildPipelineEventsUrl(apiBaseUrl, workspaceId, meetingId) });
    })().catch(() => sendResponse({ token: null, url: null }));
    return true;
  }

  if (message.type === 'STOP_CAPTURE') {
    (async () => {
      const storage = await trustedStorage.get(['activeCapture', 'apiBaseUrl']);
      const activeCapture = storage.activeCapture as { workspaceId?: string; meetingId?: string; extensionSessionToken?: string } | undefined;
      const stop = await sendOffscreen<{ endedAt?: string }>('STOP_STREAM');
      if (activeCapture?.workspaceId && activeCapture.meetingId && activeCapture.extensionSessionToken) {
        const apiBaseUrl = storage.apiBaseUrl || 'http://localhost:8000/api/v1';
        const response = await fetch(`${apiBaseUrl}/workspaces/${activeCapture.workspaceId}/meetings/${activeCapture.meetingId}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeCapture.extensionSessionToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ended_at: stop?.endedAt ?? new Date().toISOString(), reason: 'user_stopped' }),
        });
        if (!response.ok) {
          sendResponse({ status: 'error', error: 'Meeting could not be finalized. Retry Stop to finish safely.' });
          return;
        }
      }
      await trustedStorage.remove('activeCapture');
      currentMeetingId = '';
      currentWorkspaceId = '';
      sendResponse({ status: 'stopped' });
    })().catch((err: unknown) => sendResponse({ status: 'error', error: err instanceof Error ? err.message : String(err) }));
    return true;
  }

  if (message.type === 'PAUSE_CAPTURE' || message.type === 'RESUME_CAPTURE') {
    const offscreenType = message.type === 'PAUSE_CAPTURE' ? 'PAUSE_STREAM' : 'RESUME_STREAM';
    sendOffscreen<{ atMs: number }>(offscreenType).then((result) => sendResponse({ status: 'ok', atMs: result?.atMs }));
    return true;
  }

  if (message.type === 'GET_CAPTURE_STATUS') {
    trustedStorage.get(['activeCapture']).then((storage) => sendResponse({ activeCapture: storage.activeCapture ?? null }));
    return true;
  }

  return true;
});
