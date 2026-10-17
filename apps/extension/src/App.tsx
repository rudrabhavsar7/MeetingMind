import { useEffect, useRef, useState } from 'react';
import { useExtensionStore } from './store/useExtensionStore';
import { isTrustedExtensionSender } from './capture/message-policy';
import { HEARTBEAT_INTERVAL_MS, buildConsoleUrl, normalizeApiBaseUrl } from './capture/session-lifecycle';
import { Play, Square, Settings, ExternalLink, Mic, AlertCircle, Pause, PlayCircle, X, Volume2 } from 'lucide-react';

function runtimeRequest<T>(message: Record<string, unknown>): Promise<T | undefined> {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, (response: T | undefined) => {
    if (chrome.runtime.lastError) resolve(undefined);
    else resolve(response);
  }));
}

interface ExtensionPresenceSession {
  token: string;
  workspaceId: string;
  extensionDeviceId: string;
  apiBaseUrl: string;
}

export default function App() {
  const {
    state, setState, workspaceName, meetingTitle, elapsedSeconds, transcript,
    isPaused, errorMessage,
    tickElapsed, resetElapsed, clearTranscript, setMeetingTitle,
    setPaused, setErrorMessage, setWorkspaceId, setWorkspaceName
  } = useExtensionStore();

  const timerRef = useRef<number | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastMeetingId, setLastMeetingId] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8000/api/v1');
  const [apiBaseDraft, setApiBaseDraft] = useState('http://localhost:8000/api/v1');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [presenceSession, setPresenceSession] = useState<ExtensionPresenceSession | null>(null);

  useEffect(() => {
    if (!chrome.runtime) return;
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response: {
      authenticated?: boolean;
      token?: string;
      workspaceId?: string;
      workspaceName?: string;
      extensionDeviceId?: string;
      apiBaseUrl?: string;
    } | undefined) => {
      if (response?.apiBaseUrl) {
        setApiBaseUrl(response.apiBaseUrl);
        setApiBaseDraft(response.apiBaseUrl);
      }
      if (response && response.authenticated && response.workspaceId) {
        setPresenceSession(
          response.token && response.extensionDeviceId && response.apiBaseUrl
            ? {
                token: response.token,
                workspaceId: response.workspaceId,
                extensionDeviceId: response.extensionDeviceId,
                apiBaseUrl: response.apiBaseUrl,
              }
            : null
        );
        setWorkspaceId(response.workspaceId);
        if (response.workspaceName) setWorkspaceName(response.workspaceName);
        chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' }, (captureResponse) => {
          const capture = captureResponse?.activeCapture as { meetingId?: string; title?: string; startedAt?: string } | null;
          if (capture?.meetingId) {
            setLastMeetingId(capture.meetingId);
            setMeetingTitle(capture.title ?? 'Live Meeting');
            setState('recording');
            return;
          }
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab && tab.url && tab.url.includes('meet.google.com')) {
            setMeetingTitle(tab.title?.replace(' - Google Meet', '') || 'Team Sync');
            setState('detected');
          } else {
            setState('no_meeting');
          }
        });
        });
      } else {
        setPresenceSession(null);
        setState('disconnected');
      }
    });
  }, [setState, setMeetingTitle, setWorkspaceId, setWorkspaceName]);

  useEffect(() => {
    if (!presenceSession) return;
    let disposed = false;
    let heartbeatTimer: number | null = null;
    let clearPresence: (() => void) | null = null;
    const headers = {
      Authorization: `Bearer ${presenceSession.token}`,
      'Content-Type': 'application/json',
    };
    const presenceUrl = `${presenceSession.apiBaseUrl.replace(/\/+$/, '')}/extension/presence`;
    let requestPending = false;
    const sendHeartbeat = async () => {
      if (requestPending || disposed) return;
      requestPending = true;
      try {
        await fetch(`${presenceUrl}/heartbeat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            workspace_id: presenceSession.workspaceId,
            device_id: presenceSession.extensionDeviceId,
          }),
          signal: AbortSignal.timeout(5_000),
        });
      } catch {
        // Presence is advisory; capture continues when its status service is unavailable.
      } finally {
        requestPending = false;
      }
    };

    void sendHeartbeat();
    heartbeatTimer = window.setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
    clearPresence = () => {
      void fetch(`${presenceUrl}/${presenceSession.extensionDeviceId}?workspace_id=${encodeURIComponent(presenceSession.workspaceId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${presenceSession.token}` },
        keepalive: true,
      }).catch(() => undefined);
    };

    return () => {
      disposed = true;
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      clearPresence?.();
    };
  }, [presenceSession]);

  useEffect(() => {
    const listener = (message: { target?: string; type?: string; payload?: Record<string, unknown> }, sender: chrome.runtime.MessageSender) => {
      if (!isTrustedExtensionSender(sender.url, chrome.runtime.getURL('')) || message.target !== 'ui' || !message.payload) return;
      if (message.type === 'capture_status') {
        const status = message.payload.status;
        if (status === 'paused' || status === 'recording') {
          setPaused(status === 'paused');
          setState('recording');
        }
      } else if (message.type === 'capture_error') {
        setErrorMessage(String(message.payload.error ?? 'Capture stream error'));
      } else if (message.type === 'audio_level') {
        const level = Number(message.payload.level);
        if (Number.isFinite(level)) setAudioLevel(Math.max(0, Math.min(100, level)));
      } else if (message.type === 'transcript_interim' || message.type === 'transcript_final' || message.type === 'transcript_segment_interim' || message.type === 'transcript_segment_final') {
        const data = (message.payload.data ?? {}) as Record<string, unknown>;
        useExtensionStore.getState().addTranscriptSnippet({
          id: String(data.segment_id ?? data.id ?? crypto.randomUUID()),
          speaker: String(data.speaker_label ?? data.speaker ?? 'Unknown'),
          text: String(data.text ?? ''),
          isFinal: message.type === 'transcript_final' || message.type === 'transcript_segment_final',
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [setPaused, setState, setErrorMessage, setAudioLevel]);

  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = window.setInterval(() => tickElapsed(), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state, tickElapsed]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartCapture = async () => {
    setErrorMessage(null);
    const currentTab = await new Promise<chrome.tabs.Tab | undefined>((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0])));
    if (!currentTab?.id || !currentTab.url?.includes('meet.google.com')) { setErrorMessage('Please switch to the Google Meet tab before starting capture.'); return; }
    const auth = await runtimeRequest<{ authenticated: boolean; workspaceId?: string; workspaceName?: string }>({ type: 'GET_AUTH_STATUS' });
    if (!auth?.authenticated || !auth.workspaceId) { setErrorMessage('Workspace not found. Please log into MeetingMind Console or reconnect.'); setState('disconnected'); return; }
    setWorkspaceId(auth.workspaceId);
    if (auth.workspaceName) setWorkspaceName(auth.workspaceName);
    const title = currentTab.title?.replace(' - Google Meet', '').trim() || '';
    const result = await runtimeRequest<{ status: string; meetingId?: string; error?: string }>({ type: 'START_CAPTURE', payload: { workspaceId: auth.workspaceId, title, url: currentTab.url, tabId: currentTab.id } });
    if (result?.status !== 'started' || !result.meetingId) { setErrorMessage(result?.error ?? 'Could not start meeting capture.'); return; }
    setLastMeetingId(result.meetingId);
    setMeetingTitle(title || 'Live Meeting');
    resetElapsed(); clearTranscript(); setPaused(false); setState('recording');
  };

  const handleLogin = () => {
    if (!chrome.runtime) return;
    chrome.runtime.sendMessage({ type: 'LOGIN' });
  };

  const handleStopCapture = async () => {
    const result = await runtimeRequest<{ status: string; error?: string }>({ type: 'STOP_CAPTURE' });
    if (result?.status !== 'stopped') { setErrorMessage(result?.error ?? 'Could not finish the meeting yet. Try Stop again.'); return; }
    setPaused(false); setAudioLevel(0); setState('detected');
  };

  const handleLogout = async () => {
    if (state === 'recording') {
      const result = await runtimeRequest<{ status: string; error?: string }>({ type: 'STOP_CAPTURE' });
      if (result?.status !== 'stopped') {
        setErrorMessage(result?.error ?? 'Could not finish the meeting yet. Try Stop again.');
        return;
      }
    }
    await runtimeRequest({ type: 'LOGOUT' });
    setPresenceSession(null);
    setPaused(false); setState('disconnected');
  };

  const handlePause = async () => {
    const result = await runtimeRequest<{ status: string }>({ type: 'PAUSE_CAPTURE' });
    if (result?.status === 'ok') setPaused(true);
  };

  const handleResume = async () => {
    const result = await runtimeRequest<{ status: string }>({ type: 'RESUME_CAPTURE' });
    if (result?.status === 'ok') setPaused(false);
  };

  const handleSaveServer = async () => {
    setSettingsError(null);
    if (state === 'recording') {
      setSettingsError('Stop the active capture before changing its server.');
      return;
    }
    let server: ReturnType<typeof normalizeApiBaseUrl>;
    try {
      server = normalizeApiBaseUrl(apiBaseDraft);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Invalid server URL.');
      return;
    }

    const granted = await chrome.permissions.request({ origins: [server.originPattern] });
    if (!granted) {
      setSettingsError('Permission was not granted. Current server setting is unchanged.');
      return;
    }
    const result = await runtimeRequest<{ status: string; error?: string; apiBaseUrl?: string }>({
      type: 'SET_API_BASE_URL',
      payload: { baseUrl: server.baseUrl },
    });
    if (result?.status !== 'ok' || !result.apiBaseUrl) {
      setSettingsError(result?.error ?? 'Could not save the server URL.');
      return;
    }
    try {
      const previous = normalizeApiBaseUrl(apiBaseUrl);
      if (previous.originPattern !== server.originPattern) {
        await chrome.permissions.remove({ origins: [previous.originPattern] });
      }
    } catch {
      // The current setting is saved; a missing prior grant needs no cleanup.
    }
    setApiBaseUrl(result.apiBaseUrl);
    setApiBaseDraft(result.apiBaseUrl);
    setSettingsOpen(false);
    const auth = await runtimeRequest<{
      authenticated: boolean;
      token?: string;
      workspaceId?: string;
      extensionDeviceId?: string;
      apiBaseUrl?: string;
    }>({ type: 'GET_AUTH_STATUS' });
    setPresenceSession(
      auth?.authenticated && auth.token && auth.workspaceId && auth.extensionDeviceId && auth.apiBaseUrl
        ? {
            token: auth.token,
            workspaceId: auth.workspaceId,
            extensionDeviceId: auth.extensionDeviceId,
            apiBaseUrl: auth.apiBaseUrl,
          }
        : null
    );
  };

  return (
    <div className="w-[380px] min-h-[480px] max-h-[600px] flex flex-col bg-background text-foreground shadow-xl font-sans relative">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight">MeetingMind</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${state === 'disconnected' ? 'bg-destructive' : 'bg-green-500'}`} />
              {workspaceName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {state !== 'disconnected' && (
            <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors text-xs" title="Disconnect">Disconnect</button>
          )}
          <button onClick={() => { setSettingsError(null); setSettingsOpen((open) => !open); }} className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors" title="Settings" aria-label="Extension settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        {settingsOpen && (
          <section className="mb-4 rounded-lg border border-border p-3" aria-label="Extension settings">
            <label htmlFor="api-base-url" className="mb-2 block text-xs font-medium">MeetingMind API URL</label>
            <input
              id="api-base-url"
              type="url"
              value={apiBaseDraft}
              onChange={(event) => setApiBaseDraft(event.target.value)}
              className="mb-2 w-full rounded-md border border-border bg-background p-2 text-xs"
              autoComplete="url"
              spellCheck={false}
            />
            <p className="mb-2 text-[11px] text-muted-foreground">Remote servers require HTTPS. Chrome asks permission for this server only.</p>
            {settingsError && <p role="alert" className="mb-2 text-xs text-destructive">{settingsError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setApiBaseDraft(apiBaseUrl); setSettingsOpen(false); }} className="rounded-md px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
              <button onClick={handleSaveServer} className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Save server</button>
            </div>
          </section>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start justify-between text-left shrink-0">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <span className="text-xs text-destructive">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-destructive/20 rounded transition-colors">
              <X className="w-3 h-3 text-destructive" />
            </button>
          </div>
        )}

        {state === 'disconnected' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-2" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Not Connected</h2>
              <p className="text-sm text-muted-foreground">Please log in to MeetingMind to start capturing meetings.</p>
            </div>
            <button onClick={handleLogin} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full">
              Connect to MeetingMind
            </button>
            <div className="w-full mt-2">
              <button onClick={() => setShowTokenInput(!showTokenInput)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showTokenInput ? 'Hide' : 'Or paste JWT token manually'}
              </button>
              {showTokenInput && (
                <div className="mt-2 flex flex-col gap-2">
                  <textarea value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Paste your JWT access token..." className="w-full p-2 text-xs border border-border rounded-md bg-background resize-none h-20 font-mono" />
                  <button onClick={() => {
                    if (!chrome.runtime || !tokenInput.trim()) return;
                    chrome.runtime.sendMessage({ type: 'SET_TOKEN', payload: { token: tokenInput.trim() } }, (response) => {
                      if (response?.status === 'ok' && response.workspaceId) {
                        setWorkspaceId(response.workspaceId);
                        if (response.workspaceName) setWorkspaceName(response.workspaceName);
                        void runtimeRequest<{
                          authenticated: boolean;
                          token?: string;
                          workspaceId?: string;
                          extensionDeviceId?: string;
                          apiBaseUrl?: string;
                        }>({ type: 'GET_AUTH_STATUS' }).then((auth) => {
                          setPresenceSession(
                            auth?.authenticated && auth.token && auth.workspaceId && auth.extensionDeviceId && auth.apiBaseUrl
                              ? {
                                  token: auth.token,
                                  workspaceId: auth.workspaceId,
                                  extensionDeviceId: auth.extensionDeviceId,
                                  apiBaseUrl: auth.apiBaseUrl,
                                }
                              : null
                          );
                        });
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                          const tab = tabs[0];
                          if (tab && tab.url && tab.url.includes('meet.google.com')) {
                            setMeetingTitle(tab.title?.replace(' - Google Meet', '') || 'Team Sync');
                            setState('detected');
                          } else {
                            setState('no_meeting');
                          }
                        });
                      } else {
                        setErrorMessage('Token is invalid or has no accessible workspace.');
                      }
                    });
                  }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors">
                    Save Token
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {state === 'no_meeting' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
              <Mic className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">No Meeting Detected</h2>
              <p className="text-sm text-muted-foreground px-4">Open a Google Meet tab to start capturing audio and generating insights.</p>
            </div>
          </div>
        )}

        {state === 'detected' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium border border-emerald-500/20">
                Ready to Capture
              </span>
              <h2 className="font-semibold text-xl mt-4">{meetingTitle}</h2>
              <p className="text-sm text-muted-foreground">Google Meet</p>
            </div>
            {lastMeetingId && (
              <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-left">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Meeting processed</p>
                  <p className="text-[11px] text-muted-foreground">View transcript & summary in console</p>
                </div>
                <a
                  href={buildConsoleUrl(apiBaseUrl, `/meetings/${encodeURIComponent(lastMeetingId)}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            <button onClick={handleStartCapture} className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]">
              <Play className="w-4 h-4 fill-current" />
              Start Capture
            </button>
            <p className="text-xs text-muted-foreground">MeetingMind captures audio from the active Google Meet tab.</p>
          </div>
        )}

        {state === 'recording' && (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isPaused ? 'text-amber-500' : 'text-destructive'}`}>
                    {isPaused ? 'Paused' : 'Recording'}
                  </span>
                </div>
                <h2 className="font-semibold truncate w-48">{meetingTitle}</h2>
              </div>
              <div className="text-2xl font-light tabular-nums">{formatTime(elapsedSeconds)}</div>
            </div>

            {/* Live Audio & Mic Status Indicator */}
            <div className="mb-3 p-3 bg-muted/40 border border-border rounded-lg space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                  Tab Audio
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${audioLevel > 5 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                  {audioLevel > 5 ? 'Voice Detected' : 'Listening...'}
                </span>
              </div>
              {/* Dynamic Audio VU Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75 ease-out rounded-full"
                  style={{ width: `${Math.max(audioLevel > 0 ? 5 : 0, audioLevel)}%` }}
                />
              </div>
            </div>

            <div className="flex-1 bg-muted/50 rounded-lg border border-border p-3 overflow-y-auto mb-4 flex flex-col gap-3 min-h-[160px]">
              {transcript.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Volume2 className={`w-8 h-8 mb-2 transition-colors ${audioLevel > 5 ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground/40'}`} />
                  <p className="text-xs font-medium text-foreground mb-1">
                    Listening to meeting audio...
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[240px]">
                    Audio chunks are streaming securely to MeetingMind. Full transcript, summary, and action items will generate when you click <strong>Stop</strong>.
                  </p>
                </div>
              ) : (
                transcript.map((snippet, i) => (
                  <div key={i} className={`text-sm ${!snippet.isFinal ? 'opacity-60 italic' : ''}`}>
                    <span className="font-medium text-primary mr-2">{snippet.speaker}:</span>
                    <span className="text-foreground/90">{snippet.text}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              {isPaused ? (
                <button onClick={handleResume} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg font-medium hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-[0.98]">
                  <PlayCircle className="w-4 h-4" /> Resume
                </button>
              ) : (
                <button onClick={handlePause} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg font-medium hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-[0.98]">
                  <Pause className="w-4 h-4" /> Pause
                </button>
              )}
              <button onClick={handleStopCapture} className="flex-1 flex items-center justify-center gap-2 py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm active:scale-[0.98]">
                <Square className="w-4 h-4 fill-current" /> Stop
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="p-3 bg-muted/30 border-t border-border flex justify-center">
        <a href={buildConsoleUrl(apiBaseUrl, '/dashboard')} target="_blank" rel="noreferrer" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Open MeetingMind Console <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </div>
  );
}
