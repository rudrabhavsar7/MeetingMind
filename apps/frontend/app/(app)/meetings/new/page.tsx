"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  AlertTriangle,
  Loader2,
  Volume2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api";

// ─── State machine ────────────────────────────────────────────────────────────

type CaptureState =
  | "idle"          // initial — no capture started
  | "requesting"    // waiting for mic permission
  | "recording"     // actively capturing audio
  | "paused"        // user clicked Pause
  | "stopping"      // processing stop
  | "unsupported"   // browser lacks getUserMedia
  | "denied"        // mic permission denied
  | "device_lost";  // mic disconnected mid-session

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Standalone Capture Client ────────────────────────────────────────────────

export default function StandaloneCapturePage() {
  const [captureState, setCaptureState] = useState<CaptureState>(
    typeof navigator !== "undefined" && !navigator.mediaDevices
      ? "unsupported"
      : "idle"
  );
  const [elapsed, setElapsed] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [transcript, setTranscript] = useState<{ speaker: string; text: string; final: boolean }[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const defaultWorkspaceId = user?.workspaces?.[0]?.id;

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sequenceNumberRef = useRef(0);
  const captureStartTimeRef = useRef(0);


  // Scroll transcript to bottom
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Start capture — only fires after explicit user click ──────────────────
  function connectWebSocket(streamUrl: string, streamToken: string) {
    const ws = new WebSocket(streamUrl, [streamToken]);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      const hello = {
        type: "stream_hello",
        protocol_version: "1.0",
        client_instance_id: crypto.randomUUID(),
        resume_from_sequence: sequenceNumberRef.current,
        audio: {
          encoding: "pcm_s16le",
          sample_rate_hz: 16000,
          channels: 1,
          recommended_chunk_ms: 500
        }
      };
      ws.send(JSON.stringify(hello));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transcript_interim' || msg.type === 'transcript_final') {
            setTranscript((prev) => [
              ...prev,
              { speaker: msg.payload?.speaker || "Speaker", text: msg.payload?.text || "", final: msg.type === 'transcript_final' },
            ]);
          } else if (msg.type === 'meeting_completed') {
            handleStop();
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      }
    };
  }

  function sendAudioChunk(pcmData: Int16Array) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    const offsetMs = Date.now() - captureStartTimeRef.current;
    const durationMs = (pcmData.length / 16000) * 1000;
    
    const headerSize = 20;
    const payloadSize = pcmData.byteLength;
    const buffer = new ArrayBuffer(headerSize + payloadSize);
    const dataView = new DataView(buffer);
    
    dataView.setUint8(0, 'M'.charCodeAt(0));
    dataView.setUint8(1, 'M'.charCodeAt(0));
    dataView.setUint8(2, '0'.charCodeAt(0));
    dataView.setUint8(3, '1'.charCodeAt(0));
    dataView.setUint32(4, sequenceNumberRef.current, false);
    dataView.setBigUint64(8, BigInt(offsetMs), false);
    dataView.setUint16(16, durationMs, false);
    dataView.setUint16(18, 0, false);
    
    const payloadView = new Int16Array(buffer, headerSize);
    payloadView.set(pcmData);

    sequenceNumberRef.current++;
    wsRef.current.send(buffer);
  }

  async function handleStartCapture() {
    if (captureState !== "idle") return;
    if (!defaultWorkspaceId) {
      setCaptureState("unsupported");
      return;
    }
    setCaptureState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          setCaptureState("device_lost");
          stopTimer();
        });
      });

      const { data } = await apiClient.post(`/workspaces/${defaultWorkspaceId}/meetings/live`, {
        client_type: "web_standalone",
        source_type: "microphone_capture",
        source_app: "meetingmind_web",
        source_title: meetingTitle || "Standalone Web Capture",
        started_at: new Date().toISOString()
      });

      const { stream_url, stream_token } = data.data;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      await audioContext.audioWorklet.addModule('/audio-processor.js');

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'mm-audio-processor', {
        processorOptions: { chunkDurationMs: 500, sampleRate: 16000 }
      });
      workletNodeRef.current = workletNode;

      captureStartTimeRef.current = Date.now();

      workletNode.port.onmessage = (event) => {
        const pcmData = event.data;
        sendAudioChunk(pcmData);
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      connectWebSocket(stream_url, stream_token);

      setCaptureState("recording");
      setElapsed(0);
      startTimer();

    } catch (err) {
      console.error(err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCaptureState("denied");
      } else {
        setCaptureState("unsupported");
      }
    }
  }

  function handlePause() {
    streamRef.current?.getTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCaptureState((s) => {
      if (s === "recording") { stopTimer(); return "paused"; }
      if (s === "paused") { startTimer(); return "recording"; }
      return s;
    });
  }

  function handleStop() {
    setCaptureState("stopping");
    stopTimer();
    
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    
    if (wsRef.current) {
      wsRef.current.close(1000, "Stopped");
      wsRef.current = null;
    }

    setTimeout(() => {
      setCaptureState("idle");
      setElapsed(0);
      setTranscript([]);
    }, 1500);
  }



  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center gap-4">
          <Link href="/meetings">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Meetings
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">Web Capture</h1>
            <p className="text-xs text-muted-foreground">Microphone recording — fallback mode</p>
          </div>
          {(captureState === "recording" || captureState === "paused") && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl w-full px-6 py-8 flex-1">
        {/* ── Idle ── */}
        {captureState === "idle" && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Mic className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-semibold text-foreground">Start Web Capture</h2>
              <p className="text-sm text-muted-foreground">
                Record directly from your microphone. This is a fallback mode — the
                Chrome extension provides speaker detection, tab audio, and richer metadata.
              </p>
            </div>

            {/* Meeting title input */}
            <div className="w-full max-w-sm">
              <label htmlFor="meeting-title" className="block text-sm font-medium text-foreground mb-1.5 text-left">
                Meeting title <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="meeting-title"
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Weekly team standup"
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-3 w-full max-w-sm">
              <Button
                id="start-capture-btn"
                size="lg"
                className="w-full gap-2"
                onClick={handleStartCapture}
              >
                <Mic className="h-5 w-5" />
                Start Microphone Capture
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your browser will request microphone permission. Audio is processed locally on your infrastructure.
              </p>
            </div>

            {/* Extension CTA */}
            <Card className="w-full max-w-sm border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Volume2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Want tab audio + speaker detection?</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Install the Chrome extension for full-featured Google Meet capture.
                  </p>
                  <Link href="/settings/extension" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Set up extension →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Requesting permission ── */}
        {captureState === "requesting" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-base font-medium text-foreground">Requesting microphone access…</p>
            <p className="text-sm text-muted-foreground">Please allow microphone permission in your browser.</p>
          </div>
        )}

        {/* ── Recording / Paused ── */}
        {(captureState === "recording" || captureState === "paused") && (
          <div className="space-y-6">
            {/* Status bar */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                {captureState === "recording" ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                    </span>
                    <span className="text-sm font-semibold text-destructive">Recording</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-semibold text-amber-500">Paused</span>
                  </>
                )}
                {meetingTitle && (
                  <span className="text-sm text-muted-foreground">· {meetingTitle}</span>
                )}
              </div>
              <div className="text-xl font-light tabular-nums text-foreground">
                {formatTime(elapsed)}
              </div>
            </div>

            {/* Transcript area */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 min-h-[240px] max-h-[400px] overflow-y-auto">
              {transcript.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground italic">Listening for speech…</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((seg, i) => (
                    <div key={i} className={cn("text-sm", !seg.final && "opacity-60 italic")}>
                      <span className="font-medium text-primary mr-1.5">{seg.speaker}:</span>
                      <span className="text-foreground/90">{seg.text}</span>
                    </div>
                  ))}
                  <div ref={transcriptBottomRef} />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handlePause}
                aria-label={captureState === "paused" ? "Resume capture" : "Pause capture"}
              >
                {captureState === "paused" ? (
                  <><Play className="h-4 w-4" />Resume</>
                ) : (
                  <><Pause className="h-4 w-4" />Pause</>
                )}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={handleStop}
              >
                <Square className="h-4 w-4 fill-current" />
                Stop & Save
              </Button>
            </div>
          </div>
        )}

        {/* ── Stopping ── */}
        {captureState === "stopping" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-base font-medium text-foreground">Saving your meeting…</p>
            <p className="text-sm text-muted-foreground">Finalizing transcript and queuing for AI processing.</p>
          </div>
        )}

        {/* ── Error states ── */}
        {(captureState === "denied" || captureState === "unsupported" || captureState === "device_lost") && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            {captureState === "device_lost" ? (
              <MicOff className="h-12 w-12 text-destructive/60" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-destructive/60" />
            )}
            <div className="space-y-2 max-w-sm">
              <p className="text-base font-medium text-foreground">
                {captureState === "denied" && "Microphone access denied"}
                {captureState === "unsupported" && "Browser not supported"}
                {captureState === "device_lost" && "Microphone disconnected"}
              </p>
              <p className="text-sm text-muted-foreground">
                {captureState === "denied" &&
                  "Please allow microphone access in your browser settings, then try again."}
                {captureState === "unsupported" &&
                  "Your browser does not support microphone capture. Use Chrome 116+ or Firefox 115+."}
                {captureState === "device_lost" &&
                  "Your microphone was disconnected during recording. The session has been saved up to this point."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => { setCaptureState("idle"); setTranscript([]); setElapsed(0); }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
