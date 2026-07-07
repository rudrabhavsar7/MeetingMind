import { useEffect, useRef } from 'react';
import { useExtensionStore } from './store/useExtensionStore';
import { Play, Square, Settings, ExternalLink, Mic, AlertCircle } from 'lucide-react';

export default function App() {
  const { 
    state, setState, workspaceName, meetingTitle, elapsedSeconds, transcript,
    tickElapsed, resetElapsed, addTranscriptSnippet, clearTranscript, setMeetingTitle
  } = useExtensionStore();

  const timerRef = useRef<number | null>(null);

  // Initial detection simulation
  useEffect(() => {
    // In a real extension, we would query chrome.tabs here
    const checkTab = async () => {
      // Simulate checking connection
      setTimeout(() => {
        // Assume connected for demo purposes
        // Simulate checking if on Google Meet
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab && tab.url && tab.url.includes('meet.google.com')) {
            setMeetingTitle(tab.title?.replace(' - Google Meet', '') || 'Team Sync');
            setState('detected');
          } else {
            // For local dev without chrome extension API context, just mock it
            if (!chrome.tabs) {
              setMeetingTitle('Product Sync (Mock)');
              setState('detected');
            } else {
              setState('no_meeting');
            }
          }
        });
      }, 500);
    };
    checkTab();
  }, [setState, setMeetingTitle]);

  // Recording timer and mock transcript simulation
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = window.setInterval(() => {
        tickElapsed();
        
        // Mock streaming transcript every ~3 seconds
        if (Math.random() > 0.6) {
          addTranscriptSnippet({
            id: Math.random().toString(),
            speaker: Math.random() > 0.5 ? 'Prashant' : 'Rudra',
            text: 'This is a simulated transcript segment for the UI demo...',
            isFinal: Math.random() > 0.2
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, tickElapsed, addTranscriptSnippet]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartCapture = () => {
    resetElapsed();
    clearTranscript();
    setState('recording');
  };

  const handleStopCapture = () => {
    // In real app, confirm if > 60s
    setState('detected');
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
        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
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
            <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full">
              Log in to Web Console
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                  <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Recording</span>
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

            <button 
              onClick={handleStopCapture}
              className="flex items-center justify-center gap-2 w-full py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-medium hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm active:scale-[0.98]"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop Capture
            </button>
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
