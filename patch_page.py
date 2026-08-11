import re

def update_page():
    path = r'u:\MeetingMind\apps\frontend\app\(app)\meetings\new\page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add imports
    content = content.replace(
        'import { cn } from "@/lib/utils";',
        'import { cn } from "@/lib/utils";\nimport { useAuthStore } from "@/stores/auth-store";\nimport { apiClient } from "@/lib/api";'
    )

    # Add hooks in StandaloneCapturePage
    hooks = """  const { user } = useAuthStore();
  const defaultWorkspaceId = user?.workspaces?.[0]?.id;

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sequenceNumberRef = useRef(0);
  const captureStartTimeRef = useRef(0);
"""
    content = content.replace(
        '  const transcriptBottomRef = useRef<HTMLDivElement>(null);',
        '  const transcriptBottomRef = useRef<HTMLDivElement>(null);\n' + hooks
    )

    # Replace handleStartCapture and add connectWebSocket / sendAudioChunk
    start_capture_old = r"""  async function handleStartCapture\(\) \{
    if \(captureState !== "idle"\) return;
    setCaptureState\("requesting"\);

    try \{
      const stream = await navigator\.mediaDevices\.getUserMedia\(\{ audio: true \}\);
      streamRef\.current = stream;

      // Detect if mic is lost mid-session
      stream\.getTracks\(\)\.forEach\(\(track\) => \{
        track\.addEventListener\("ended", \(\) => \{
          setCaptureState\("device_lost"\);
          stopTimer\(\);
        \}\);
      \}\);

      setCaptureState\("recording"\);
      setElapsed\(0\);
      startTimer\(\);

      // In v1: hand off stream to WebSocket connection \(MM-304 wires this\)
      // For now: simulates interim transcript events for UI demo
      // simulateTranscript\(\);
    \} catch \(err\) \{
      if \(err instanceof DOMException && err\.name === "NotAllowedError"\) \{
        setCaptureState\("denied"\);
      \} else \{
        setCaptureState\("unsupported"\);
      \}
    \}
  \}"""

    new_capture_logic = """  function connectWebSocket(streamUrl: string, streamToken: string, meetingId: string) {
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

      const { stream_url, stream_token, meeting } = data.data;

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
        if (captureState === 'paused') return;
        const pcmData = event.data;
        sendAudioChunk(pcmData);
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      connectWebSocket(stream_url, stream_token, meeting.id);

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
  }"""
    content = re.sub(start_capture_old, new_capture_logic, content, count=1, flags=re.DOTALL)

    # Replace handleStop to close ws and audio context
    stop_old = r"""  function handleStop\(\) \{
    setCaptureState\("stopping"\);
    stopTimer\(\);
    streamRef\.current\?\.getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\);
    streamRef\.current = null;
    // In v1: send end-of-stream signal to backend, wait for meeting_completed event
    setTimeout\(\(\) => \{
      setCaptureState\("idle"\);
      setElapsed\(0\);
      setTranscript\(\[\]\);
    \}, 1500\);
  \}"""

    stop_new = """  function handleStop() {
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
  }"""
    content = re.sub(stop_old, stop_new, content, count=1, flags=re.DOTALL)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    update_page()
