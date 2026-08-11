/// <reference types="chrome"/>

let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let workletNode: AudioWorkletNode | null = null;
let ws: WebSocket | null = null;

let meetingId = "";
const clientInstanceId = crypto.randomUUID();
let streamToken = "";
let streamUrl = "";
let sequenceNumber = 0;
let recommendedChunkMs = 500;
let replayBuffer: Array<{ seq: number, buffer: ArrayBuffer, timestamp: number }> = [];

let pingInterval: number;
let reconnectDelayMs = 1000;
let isReconnecting = false;
let isPaused = false;

// We need to store the start time of the context to calculate precise offsets
let captureStartTimeMs = 0;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;

  if (message.type === 'START_STREAM') {
    startCapture(message.payload)
      .then(() => sendResponse({ status: 'ok' }))
      .catch(err => sendResponse({ status: 'error', error: err.message }));
    return true; // async
  }

  if (message.type === 'STOP_STREAM') {
    stopCapture();
    sendResponse({ status: 'ok' });
  }

  if (message.type === 'PAUSE_STREAM') {
    isPaused = true;
    sendResponse({ status: 'ok' });
  }

  if (message.type === 'RESUME_STREAM') {
    isPaused = false;
    sendResponse({ status: 'ok' });
  }
});

async function startCapture(payload: {streamId: string, token: string, url: string, id: string}) {
  const { streamId, token, url, id } = payload;
  streamToken = token;
  streamUrl = url;
  meetingId = id;
  sequenceNumber = 0;
  replayBuffer = [];
  captureStartTimeMs = Date.now();

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  });

  audioContext = new AudioContext({ sampleRate: 16000 });
  await audioContext.audioWorklet.addModule('audio-processor.js');

  const source = audioContext.createMediaStreamSource(mediaStream);
  
  // We MUST route the captured source to the default destination so meeting audio remains audible (from protocol spec)
  source.connect(audioContext.destination);

  workletNode = new AudioWorkletNode(audioContext, 'mm-audio-processor', {
    processorOptions: {
      chunkDurationMs: recommendedChunkMs,
      sampleRate: 16000
    }
  });

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);

  workletNode.port.onmessage = (event) => {
    if (isPaused) return;
    const pcmBuffer = event.data; // Int16Array
    sendAudioChunk(pcmBuffer);
  };

  connectWebSocket();
}

function stopCapture() {
  if (workletNode) {
    workletNode.disconnect();
    workletNode = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  if (ws) {
    ws.close(1000, "Stopped");
    ws = null;
  }
  clearInterval(pingInterval);
}

function connectWebSocket() {
  ws = new WebSocket(streamUrl, [streamToken]);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    isReconnecting = false;
    reconnectDelayMs = 1000;
    
    // Send stream_hello
    const hello = {
      type: "stream_hello",
      protocol_version: "1.0",
      client_instance_id: clientInstanceId,
      resume_from_sequence: sequenceNumber,
      audio: {
        encoding: "pcm_s16le",
        sample_rate_hz: 16000,
        channels: 1,
        recommended_chunk_ms: recommendedChunkMs
      }
    };
    ws?.send(JSON.stringify(hello));

    // Start heartbeat
    pingInterval = self.setInterval(() => {
      ws?.send(JSON.stringify({ type: "ping", nonce: Date.now() }));
    }, 15000);
  };

  ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stream_ready') {
          recommendedChunkMs = msg.recommended_chunk_ms || recommendedChunkMs;
          if (workletNode) {
            workletNode.port.postMessage({ type: 'UPDATE_CHUNK_SIZE', chunkDurationMs: recommendedChunkMs });
          }
          // Replay unacked buffer if any
          for (const item of replayBuffer) {
            ws?.send(item.buffer);
          }
        } else if (msg.type === 'audio_ack') {
          const ackedSeq = msg.highest_contiguous_sequence;
          replayBuffer = replayBuffer.filter(item => item.seq > ackedSeq);
        } else if (msg.type === 'slow_down') {
          console.warn("Server requested to slow down.");
        } else {
          // Forward transcript and other events to the extension UI
          chrome.runtime.sendMessage({ target: 'ui', type: msg.type, payload: msg });
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    }
  };

  ws.onclose = (event) => {
    clearInterval(pingInterval);
    if (event.code === 1000) return; // Normal closure
    
    // Exclude terminal codes (e.g. 4403, 4404, 4406, 4413)
    const terminalCodes = [4403, 4404, 4406, 4413];
    if (terminalCodes.includes(event.code)) {
      console.error("Terminal WebSocket close code:", event.code);
      return;
    }

    if (!isReconnecting) {
      scheduleReconnect();
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function scheduleReconnect() {
  isReconnecting = true;
  setTimeout(() => {
    // Note: If token is expired (4401), we should ask background to get a new token.
    // For simplicity, we just reconnect. 
    // The spec says: on reconnect, mint a new handshake token.
    chrome.runtime.sendMessage({ type: "REQUEST_NEW_STREAM_TOKEN", meetingId }, (response) => {
      if (response && response.token) {
        streamToken = response.token;
        streamUrl = response.url;
        connectWebSocket();
      }
    });
  }, reconnectDelayMs);
  
  reconnectDelayMs = Math.min(reconnectDelayMs * 2, 15000); // Exponential backoff with 15s max
}

function sendAudioChunk(pcmData: Int16Array) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    // Buffer if disconnected (we rely on the audioContext keep pumping)
    // Actually we buffer the constructed MM01 frame
  }

  const offsetMs = Date.now() - captureStartTimeMs;
  const durationMs = (pcmData.length / 16000) * 1000;
  
  // Build MM01 Frame
  // Magic (4) + Seq (4) + Offset (8) + Duration (2) + Flags (2) = 20 bytes header
  const headerSize = 20;
  const payloadSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(headerSize + payloadSize);
  const dataView = new DataView(buffer);
  
  // 0-3: Magic 'MM01'
  dataView.setUint8(0, 'M'.charCodeAt(0));
  dataView.setUint8(1, 'M'.charCodeAt(0));
  dataView.setUint8(2, '0'.charCodeAt(0));
  dataView.setUint8(3, '1'.charCodeAt(0));
  
  // 4-7: Sequence number (UInt32 BE)
  dataView.setUint32(4, sequenceNumber, false);
  
  // 8-15: Start offset in milliseconds (UInt64 BE)
  // DataView doesn't have setBigUint64 on all old browsers but since MV3 targets Chrome 116+, it's fine
  dataView.setBigUint64(8, BigInt(offsetMs), false);
  
  // 16-17: Duration in milliseconds (UInt16 BE)
  dataView.setUint16(16, durationMs, false);
  
  // 18-19: Flags (UInt16 BE), 0 for now
  dataView.setUint16(18, 0, false);
  
  // 20+: PCM payload
  const payloadView = new Int16Array(buffer, headerSize);
  payloadView.set(pcmData);

  const seq = sequenceNumber++;
  
  // Retain for replay (max 60 seconds)
  replayBuffer.push({ seq, buffer, timestamp: Date.now() });
  
  // Drop oldest if exceeding 60s
  const cutoff = Date.now() - 60000;
  while (replayBuffer.length > 0 && replayBuffer[0].timestamp < cutoff) {
    replayBuffer.shift();
    // Real implementation should send `audio_gap` here.
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(buffer);
  }
}
