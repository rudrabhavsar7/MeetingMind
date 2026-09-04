import { useEffect, useRef } from 'react';
import { useExtensionStore } from './store/useExtensionStore';
import { Play, Square, Settings, ExternalLink, Mic, AlertCircle, Pause, PlayCircle, X } from 'lucide-react';

export default function App() {
  const { 
    state, setState, workspaceName, meetingTitle, elapsedSeconds, transcript,
    isPaused, errorMessage,
    tickElapsed, resetElapsed, addTranscriptSnippet, clearTranscript, setMeetingTitle,
    setPaused, setErrorMessage
  } = useExtensionStore();

  const timerRef = useRef<number | null>(null);

  // Check auth status on mount
  useEffect(() => {
    if (!chrome.runtime) return;

    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
      if (response && response.authenticated) {
        // Token exists, check for meeting tab
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
        setState('disconnected');
      }
    });
  }, [setState, setMeetingTitle]);

  // Listen for error events from offscreen document
  useEffect(() => {
    if (!chrome.runtime || !chrome.runtime.onMessage) return;

    const messageListener = (message: { target?: string; type?: string; payload?: { error?: string } }) => {
      if (message.target === 'ui' && message.type === 'capture_error') {
        setErrorMessage(message.payload?.error || 'An unknown error occurred');
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [setErrorMessage]);

  // Recording timer and event listener
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = window.setInterval(() => {
        tickElapsed();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageListener = (message: any) => {
      if (message.target === 'ui') {
        if (message.type === 'transcript_interim' || message.type === 'transcript_final') {
          addTranscriptSnippet({
            id: message.payload.segment_id || Math.random().toString(),
            speaker: message.payload.speaker || 'Unknown',
            text: message.payload.text,
            isFinal: message.type === 'transcript_final'
          });
        } else if (message.type === 'meeting_completed') {
          setState('detected');
        } else if (message.type === 'capture_error') {
          setErrorMessage(message.payload?.error || 'An unknown error occurred');
        }
      }
    };

    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, [state, tickElapsed, addTranscriptSnippet, setState, setErrorMessage]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartCapture = async () => {
    if (!chrome.tabs) {
      resetElapsed();
      clearTranscript();
      setState('recording');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) return;
      
      chrome.runtime.sendMessage({
        type: 'START_CAPTURE',
        payload: {
          tabId: tab.id,
          workspaceId: 'default',
          title: meetingTitle,
          url: tab.url
        }
      }, (response) => {
        if (response && response.status === 'started') {
          resetElapsed();
          clearTranscript();
          setPaused(false);
          setState('recording');
        } else {
          console.error('Failed to start capture', response?.error);
        }
      });
    });
  };

  const handleStopCapture = () => {
    if (!chrome.tabs) {
      setState('detected');
      return;
    }
    chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }, () => {
      setPaused(false);
      setState('detected');
    });
  };

  const handleLogin = () => {
    if (!chrome.runtime) return;
    chrome.runtime.sendMessage({ type: 'LOGIN' });
  };

  const handleLogout = () => {
    if (!chrome.runtime) return;
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
      setPaused(false);
      setState('disconnected');
    });
  };

  const handlePause = () => {
    if (!chrome.runtime) return;
    chrome.runtime.sendMessage({ target: 'offscreen', type: 'PAUSE_STREAM' }, () => {
      setPaused(true);
    });
  };

  const handleResume = () => {
    if (!chrome.runtime) return;
    chrome.runtime.sendMessage({ target: 'offscreen', type: 'RESUME_STREAM' }, () => {
      setPaused(false);
    });
  };

  return (
    <div className="w-[380px] min-h-[480px] max-h-[600px] flex flex-col bg-background text-foreground shadow-xl font-sans relative">
      {/* Header */}
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
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors text-xs"
              title="Disconnect"
            >
              Disconnect
            </button>
          )}
          <button className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        {state === 'disconnected' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-2" />
            <div>
              <h2 className="font-semibold text-lg mb-1">Not Connected</h2>
              <p className="text-sm text-muted-foreground">Please log in to MeetingMind to start capturing meetings.</p>
            </div>
            <button 
              onClick={handleLogin}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full"
            >
              Connect to MeetingMind
            </button>
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
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium border border-emerald-500/20">
                Ready to Capture
              </span>
              <h2 className="font-semibold text-xl mt-4">{meetingTitle}</h2>
              <p className="text-sm text-muted-foreground">Google Meet</p>
            </div>
            
            <button 
              onClick={handleStartCapture}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Capture
            </button>
            <p className="text-xs text-muted-foreground mt-2">Browser will request tab audio permission.</p>
          </div>
        )}

        {state === 'recording' && (
          <div className="flex-1 flex flex-col h-full">
            {errorMessage && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span className="text-sm text-destructive">{errorMessage}</span>
                </div>
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:bg-destructive/20 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
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
              <div className="text-2xl font-light tabular-nums">
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            <div className="flex-1 bg-muted/50 rounded-lg border border-border p-3 overflow-y-auto mb-4 flex flex-col gap-3 min-h-[200px]">
              {transcript.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground italic">
                  Listening for speech...
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
                <button 
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg font-medium hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-[0.98]"
                >
                  <PlayCircle className="w-4 h-4" />
                  Resume
                </button>
              ) : (
                <button 
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg font-medium hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-[0.98]"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              <button 
                onClick={handleStopCapture}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm active:scale-[0.98]"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-3 bg-muted/30 border-t border-border flex justify-center">
        <a href="http://localhost:3000/dashboard" target="_blank" rel="noreferrer" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Open MeetingMind Console <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </div>
  );
}
