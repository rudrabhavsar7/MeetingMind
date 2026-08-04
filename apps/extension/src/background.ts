/// <reference types="chrome"/>

let currentMeetingId = "";
let currentWorkspaceId = ""; // Assume selected from UI

async function setupOffscreenDocument(path: string) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['USER_MEDIA'],
    justification: 'Recording meeting audio for MeetingMind'
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CAPTURE') {
    (async () => {
      try {
        const { tabId, workspaceId, title, url } = message.payload;
        currentWorkspaceId = workspaceId;

        // 1. Get MediaStreamId
        const streamId = await new Promise<string>((resolve, reject) => {
          chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError);
            }
            resolve(id);
          });
        });

        // 2. Make API call to backend (we use fetch here, assuming we inject bearer from storage)
        const storage = await chrome.storage.local.get(['extensionToken', 'apiBaseUrl']);
        const token = storage.extensionToken;
        const apiBaseUrl = storage.apiBaseUrl || "http://localhost:8000/api/v1";

        const response = await fetch(`${apiBaseUrl}/workspaces/${workspaceId}/meetings/live`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_type: "chrome_extension",
            source_type: "extension_capture",
            source_app: "google_meet", // simplified
            source_url: url,
            source_title: title,
            started_at: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error("Failed to start meeting on backend");
        }
        
        const json = await response.json();
        const { stream_url, stream_token, meeting } = json.data;
        currentMeetingId = meeting.id;

        // 3. Setup Offscreen Doc
        await setupOffscreenDocument('offscreen.html');

        // 4. Send Stream ID and tokens to Offscreen Doc
        chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'START_STREAM',
          payload: {
            streamId,
            token: stream_token,
            url: stream_url,
            id: currentMeetingId
          }
        }, (res) => {
          sendResponse({ status: 'started', meetingId: currentMeetingId });
        });
      } catch (err: any) {
        console.error("Capture error:", err);
        sendResponse({ status: 'error', error: err.message });
      }
    })();
    return true; // async
  }
  
  if (message.type === 'REQUEST_NEW_STREAM_TOKEN') {
    (async () => {
      try {
        const storage = await chrome.storage.local.get(['extensionToken', 'apiBaseUrl']);
        const token = storage.extensionToken;
        const apiBaseUrl = storage.apiBaseUrl || "http://localhost:8000/api/v1";

        const response = await fetch(`${apiBaseUrl}/workspaces/${currentWorkspaceId}/meetings/${message.meetingId}/stream-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_instance_id: crypto.randomUUID(), // For simplified reconnect
            last_acknowledged_sequence: -1
          })
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

  if (message.type === 'STOP_CAPTURE') {
    chrome.runtime.sendMessage({ target: 'offscreen', type: 'STOP_STREAM' });
    sendResponse({ status: 'stopped' });
  }

  return true;
});

