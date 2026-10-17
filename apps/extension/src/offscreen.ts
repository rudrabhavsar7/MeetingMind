/// <reference types="chrome"/>

import { buildAudioFrame, buildCaptureControl, buildStreamHello, nextAudioFrameStartOffset, normalizeTranscriptEvent, pipelineAuthSubprotocols, websocketSubprotocols, MM01_MAX_SESSION_DURATION_MS, type CaptureAction } from './capture/stream-protocol';
import { BoundedReplayBuffer } from './capture/replay-buffer';
import { isTrustedExtensionSender } from './capture/message-policy';
import { getCaptureConnectionPlan, getMicrophonePermissionError, getPcmAudioLevel, microphonePermissionRequest } from './capture/audio-capture';
import { canResumeSocketDrain, heartbeatTimedOut, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS, sessionLimitReached, shouldPauseSocketDrain } from './capture/session-lifecycle';

let replayBuffer = new BoundedReplayBuffer(60_000);
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let microphoneStream: MediaStream | null = null;
let workletNode: AudioWorkletNode | null = null;
let socket: WebSocket | null = null;
let pipelineSocket: WebSocket | null = null;
let meetingId = '';
let workspaceId = '';
let clientInstanceId = '';
let streamToken = '';
let streamUrl = '';
let sequenceNumber = 0;
let lastAcknowledgedSequence = -1;
let captureStartedAt = 0;
let heartbeatTimer: number | undefined;
let socketDrainTimer: number | undefined;
let durationTimer: number | undefined;
let expiryTimer: number | undefined;
let reconnectTimer: number | undefined;
let pipelineReconnectTimer: number | undefined;
let pipelineCloseTimer: number | undefined;
let reconnectDelayMs = 1_000;
let pipelineReconnectDelayMs = 1_000;
let slowDownUntil = 0;
let lastServerActivityAt = 0;
let lastPingAt = 0;
let pendingPingNonce: string | null = null;
let isPaused = false;
let isStopping = false;
let isReady = false;
let lastSentSequence = -1;
let reconnecting = false;
let pipelineReconnecting = false;
let pipelineEnding = false;
let pendingControls: Array<ReturnType<typeof buildCaptureControl>> = [];
let ackWaiters: Array<{ sequence: number; resolve: () => void }> = [];
let stopPromise: Promise<{ endedAt: string; lastSequence: number }> | null = null;
let nextFrameOffsetMs: number | null = null;
let audioGapPending = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen' || !isTrustedExtensionSender(sender.url, chrome.runtime.getURL(''))) return false;
  if (message.type === 'START_STREAM') {
    startCapture(message.payload).then(() => sendResponse({ status: 'ok' })).catch((error: unknown) => {
      void stopCapture();
      sendResponse({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  }
  if (message.type === 'STOP_STREAM') {
    stopCapture().then((result) => sendResponse({ status: 'ok', ...result })).catch((error: unknown) => {
      sendResponse({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  }
  if (message.type === 'PAUSE_STREAM' || message.type === 'RESUME_STREAM') {
    const action: CaptureAction = message.type === 'PAUSE_STREAM' ? 'pause' : 'resume';
    setPaused(action === 'pause');
    sendResponse({ status: 'ok', atMs: elapsedMs() });
    return false;
  }
  return false;
});

async function startCapture(payload: { streamId: string; token: string; url: string; id: string; clientInstanceId: string; workspaceId: string }): Promise<void> {
  if (mediaStream || audioContext) await stopCapture();
  closePipelineEvents();
  stopPromise = null;
  meetingId = payload.id;
  workspaceId = payload.workspaceId;
  clientInstanceId = payload.clientInstanceId;
  streamToken = payload.token;
  streamUrl = payload.url;
  sequenceNumber = 0;
  lastAcknowledgedSequence = -1;
  lastSentSequence = -1;
  replayBuffer = new BoundedReplayBuffer(60_000);
  captureStartedAt = performance.now();
  lastServerActivityAt = Date.now();
  lastPingAt = 0;
  pendingPingNonce = null;
  isPaused = false;
  isStopping = false;
  reconnecting = false;
  pendingControls = [];
  ackWaiters = [];
  nextFrameOffsetMs = null;
  audioGapPending = false;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: payload.streamId } } as MediaTrackConstraints,
  });
  mediaStream.getAudioTracks()[0]?.addEventListener('ended', () => {
    if (!isStopping) chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
  }, { once: true });
  audioContext = new AudioContext({ sampleRate: 16_000 });
  await audioContext.audioWorklet.addModule(chrome.runtime.getURL('audio-processor.js'));
  const tabSource = audioContext.createMediaStreamSource(mediaStream);
  tabSource.connect(audioContext.destination);
  let microphone: MediaStream;
  try {
    microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneStream = microphone;
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
      void chrome.runtime.sendMessage(microphonePermissionRequest());
    }
    throw new Error(getMicrophonePermissionError(error));
  }
  const microphoneSource = audioContext.createMediaStreamSource(microphone);
  workletNode = new AudioWorkletNode(audioContext, 'mm-audio-processor', {
    processorOptions: { chunkDurationMs: 500, sampleRate: 16_000 },
  });
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;
  for (const [sourceName, destinationName] of getCaptureConnectionPlan()) {
    if (destinationName === 'destination') continue;
    (sourceName === 'tab' ? tabSource : microphoneSource).connect(workletNode);
  }
  workletNode.connect(silentGain);
  silentGain.connect(audioContext.destination);
  workletNode.port.onmessage = (event: MessageEvent<Int16Array>) => {
    if (isPaused || isStopping) return;
    notifyUi('audio_level', { level: getPcmAudioLevel(event.data) });
    const offsetMs = nextAudioFrameStartOffset(nextFrameOffsetMs, elapsedMs(), audioGapPending);
    const durationMs = event.data.length / 16;
    if (sessionLimitReached(offsetMs + durationMs, MM01_MAX_SESSION_DURATION_MS)) {
      notifyUi('capture_error', { error: 'Eight-hour capture limit reached. Ending this meeting safely.' });
      chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
      return;
    }
    const frame = buildAudioFrame(sequenceNumber++, offsetMs, event.data);
    nextFrameOffsetMs = offsetMs + durationMs;
    audioGapPending = false;
    const evicted = replayBuffer.append(frame, performance.now());
    for (const gap of evicted) sendJson(gap);
    drainFrames();
  };
  expiryTimer = self.setInterval(() => {
    for (const gap of replayBuffer.evictExpired(performance.now())) sendJson(gap);
  }, 1_000);
  durationTimer = self.setTimeout(() => {
    notifyUi('capture_error', { error: 'Eight-hour capture limit reached. Ending this meeting safely.' });
    chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
  }, MM01_MAX_SESSION_DURATION_MS);
  connectWebSocket(false);
  connectPipelineEvents();
}

function stopCapture(): Promise<{ endedAt: string; lastSequence: number }> {
  if (stopPromise) return stopPromise;
  isStopping = true;
  pipelineEnding = true;
  const finalSequence = sequenceNumber - 1;
  const endedAt = new Date().toISOString();
  stopPromise = (async () => {
    if (workletNode) workletNode.port.onmessage = null;
    if (finalSequence >= 0 && lastAcknowledgedSequence < finalSequence) {
      drainFrames(true);
      await waitForAck(finalSequence, 5_000);
    }
    cleanupCapture(false);
    pipelineCloseTimer = self.setTimeout(closePipelineEvents, 5 * 60_000);
    return { endedAt, lastSequence: finalSequence };
  })();
  return stopPromise;
}

function cleanupCapture(closePipeline = true): void {
  if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
  if (socketDrainTimer !== undefined) clearTimeout(socketDrainTimer);
  if (durationTimer !== undefined) clearTimeout(durationTimer);
  if (expiryTimer !== undefined) clearInterval(expiryTimer);
  if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
  if (closePipeline && pipelineReconnectTimer !== undefined) clearTimeout(pipelineReconnectTimer);
  heartbeatTimer = undefined;
  socketDrainTimer = undefined;
  durationTimer = undefined;
  expiryTimer = undefined;
  reconnectTimer = undefined;
  if (closePipeline) pipelineReconnectTimer = undefined;
  if (workletNode) workletNode.disconnect();
  workletNode = null;
  if (audioContext) void audioContext.close();
  audioContext = null;
  if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
  mediaStream = null;
  if (microphoneStream) microphoneStream.getTracks().forEach((track) => track.stop());
  microphoneStream = null;
  if (socket) socket.close(1000, 'Stopped');
  socket = null;
  if (closePipeline) closePipelineEvents();
  isReady = false;
  isStopping = false;
  reconnecting = false;
  if (closePipeline) pipelineReconnecting = false;
}

function connectWebSocket(isReconnect: boolean): void {
  if (isStopping) return;
  if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
  if (socket) socket.onclose = null;
  socket = new WebSocket(streamUrl, websocketSubprotocols(streamToken));
  socket.binaryType = 'arraybuffer';
  socket.onopen = () => {
    reconnecting = false;
    isReady = false;
    reconnectDelayMs = 1_000;
    lastServerActivityAt = Date.now();
    lastPingAt = 0;
    socket?.send(JSON.stringify(buildStreamHello(clientInstanceId, lastAcknowledgedSequence)));
    heartbeatTimer = self.setInterval(() => {
      if (socket?.readyState !== WebSocket.OPEN) return;
      const now = Date.now();
      if (heartbeatTimedOut(lastServerActivityAt, now)) {
        socket.close(4408, 'Heartbeat timeout');
        return;
      }
      if (now - lastServerActivityAt >= HEARTBEAT_INTERVAL_MS && now - lastPingAt >= HEARTBEAT_INTERVAL_MS) {
        pendingPingNonce = crypto.randomUUID();
        lastPingAt = now;
        socket.send(JSON.stringify({ type: 'ping', nonce: pendingPingNonce }));
      }
    }, Math.min(HEARTBEAT_INTERVAL_MS / 3, HEARTBEAT_TIMEOUT_MS / 3));
  };
  socket.onmessage = (event: MessageEvent) => {
    if (typeof event.data !== 'string') return;
    try {
      const msg = JSON.parse(event.data) as Record<string, unknown>;
      if (msg.type === 'pong' && pendingPingNonce && msg.nonce !== pendingPingNonce) return;
      lastServerActivityAt = Date.now();
      if (msg.type === 'pong') pendingPingNonce = null;
      if (msg.type === 'ping') sendJson({ type: 'pong', nonce: msg.nonce });
      else if (msg.type === 'stream_ready') {
        isReady = true;
        const highest = Number(msg.highest_contiguous_sequence ?? -1);
        acknowledge(highest);
        for (const gap of replayBuffer.pendingGaps()) sendJson(gap);
        if (isReconnect) {
          for (const frame of replayBuffer.replayFrames()) sendBinary(frame);
          lastSentSequence = replayBuffer.lastSequence;
        } else lastSentSequence = lastAcknowledgedSequence;
        for (const control of pendingControls) sendJson(control);
        pendingControls = [];
        drainFrames();
        notifyUi('capture_status', { status: 'recording', meetingId });
      } else if (msg.type === 'audio_ack') acknowledge(Number(msg.highest_contiguous_sequence));
      else if (msg.type === 'slow_down') {
        const retry = Math.max(0, Math.min(30_000, Number(msg.retry_after_ms ?? 1_000)));
        slowDownUntil = Math.max(slowDownUntil, Date.now() + retry);
        setTimeout(drainFrames, retry);
      } else {
        const transcriptEvent = normalizeTranscriptEvent(msg);
        if (transcriptEvent) notifyUi(transcriptEvent.type, { ...msg, data: transcriptEvent.data });
        else notifyUi(String(msg.type ?? 'server_event'), msg);
      }
    } catch (error) {
      console.warn('Ignoring malformed stream event', error);
    }
  };
  socket.onclose = (event: CloseEvent) => {
    if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
    if (socketDrainTimer !== undefined) clearTimeout(socketDrainTimer);
    socketDrainTimer = undefined;
    isReady = false;
    if (isStopping || event.code === 1000) return;
    notifyUi('capture_error', { error: `Stream closed (${event.code})` });
    if ([4403, 4406, 4409, 4413, 4429].includes(event.code)) return;
    scheduleReconnect();
  };
  socket.onerror = () => notifyUi('capture_error', { error: 'WebSocket connection error' });
}

function connectPipelineEvents(): void {
  if (isStopping || pipelineReconnecting) return;
  pipelineReconnecting = true;
  chrome.runtime.sendMessage({ type: 'REQUEST_PIPELINE_SOCKET', workspaceId, meetingId }, (result: { token?: string; url?: string } | undefined) => {
    if (chrome.runtime.lastError || !result?.token || !result.url || isStopping) {
      pipelineReconnecting = false;
      if (!isStopping) schedulePipelineReconnect();
      return;
    }
    const nextSocket = new WebSocket(result.url, pipelineAuthSubprotocols(result.token));
    pipelineSocket = nextSocket;
    nextSocket.onopen = () => {
      pipelineReconnecting = false;
      pipelineReconnectDelayMs = 1_000;
    };
    nextSocket.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        const normalized = normalizeTranscriptEvent(payload);
        if (normalized) notifyUi(normalized.type, { ...payload, data: normalized.data });
        if (payload.type === 'meeting_completed') {
          notifyUi('meeting_completed', payload);
          closePipelineEvents();
        }
      } catch {
        // Ignore malformed pipeline events and keep the stream alive.
      }
    };
    nextSocket.onclose = () => {
      if (pipelineSocket === nextSocket) pipelineSocket = null;
      pipelineReconnecting = false;
      if (!isStopping && !pipelineEnding) schedulePipelineReconnect();
    };
    nextSocket.onerror = () => nextSocket.close();
  });
}

function closePipelineEvents(): void {
  if (pipelineCloseTimer !== undefined) clearTimeout(pipelineCloseTimer);
  if (pipelineReconnectTimer !== undefined) clearTimeout(pipelineReconnectTimer);
  pipelineCloseTimer = undefined;
  pipelineReconnectTimer = undefined;
  if (pipelineSocket) {
    pipelineSocket.onclose = null;
    pipelineSocket.close(1000, 'Meeting ended');
  }
  pipelineSocket = null;
  pipelineReconnecting = false;
  pipelineEnding = false;
}

function schedulePipelineReconnect(): void {
  if (pipelineReconnecting || isStopping) return;
  pipelineReconnecting = true;
  const delay = Math.floor(Math.random() * pipelineReconnectDelayMs);
  pipelineReconnectDelayMs = Math.min(pipelineReconnectDelayMs * 2, 15_000);
  pipelineReconnectTimer = self.setTimeout(() => {
    pipelineReconnecting = false;
    connectPipelineEvents();
  }, delay);
}

function scheduleReconnect(): void {
  if (reconnecting || isStopping) return;
  reconnecting = true;
  const delay = Math.floor(Math.random() * reconnectDelayMs);
  reconnectDelayMs = Math.min(reconnectDelayMs * 2, 15_000);
  reconnectTimer = self.setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'REQUEST_NEW_STREAM_TOKEN', meetingId, clientInstanceId,
      lastAcknowledgedSequence,
    }, (response: { token?: string; url?: string } | undefined) => {
      if (chrome.runtime.lastError || !response?.token || !response.url) {
        reconnecting = false;
        scheduleReconnect();
        return;
      }
      streamToken = response.token;
      streamUrl = response.url;
      connectWebSocket(true);
    });
  }, delay);
}

function drainFrames(force = false): void {
  if (!isReady || (!force && (isPaused || isStopping || Date.now() < slowDownUntil))) return;
  if (socket?.readyState === WebSocket.OPEN && shouldPauseSocketDrain(socket.bufferedAmount)) {
    waitForSocketDrain();
    return;
  }
  const frames = replayBuffer.framesAfter(lastSentSequence);
  for (const frame of frames) {
    if (Date.now() < slowDownUntil || socket?.readyState !== WebSocket.OPEN) break;
    if (shouldPauseSocketDrain(socket.bufferedAmount)) {
      waitForSocketDrain();
      break;
    }
    sendBinary(frame);
    lastSentSequence = new DataView(frame).getUint32(4, false);
  }
}

function waitForSocketDrain(): void {
  if (socketDrainTimer !== undefined) return;
  socketDrainTimer = self.setTimeout(() => {
    socketDrainTimer = undefined;
    if (socket?.readyState !== WebSocket.OPEN) return;
    if (!canResumeSocketDrain(socket.bufferedAmount)) {
      waitForSocketDrain();
      return;
    }
    drainFrames(isStopping);
  }, 250);
}

function sendBinary(frame: ArrayBuffer): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(frame);
}

function sendJson(payload: unknown): void {
  if (typeof payload === 'object' && payload !== null && 'type' in payload && payload.type === 'audio_gap' && !isReady) return;
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function acknowledge(sequence: number): void {
  if (!Number.isInteger(sequence) || sequence < lastAcknowledgedSequence) return;
  lastAcknowledgedSequence = sequence;
  replayBuffer.acknowledge(sequence);
  ackWaiters = ackWaiters.filter((waiter) => {
    if (waiter.sequence <= sequence) {
      waiter.resolve();
      return false;
    }
    return true;
  });
  drainFrames();
}

function waitForAck(sequence: number, timeoutMs: number): Promise<void> {
  if (lastAcknowledgedSequence >= sequence) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    ackWaiters.push({ sequence, resolve: finish });
  });
}

function setPaused(paused: boolean): void {
  if (isPaused === paused || isStopping) return;
  isPaused = paused;
  if (!paused) audioGapPending = true;
  const control = buildCaptureControl(paused ? 'pause' : 'resume', elapsedMs());
  if (isReady) sendJson(control);
  else pendingControls.push(control);
  notifyUi('capture_status', { status: paused ? 'paused' : 'recording', meetingId });
}

function elapsedMs(): number {
  return Math.max(0, Math.floor(performance.now() - captureStartedAt));
}

function notifyUi(type: string, payload: unknown): void {
  chrome.runtime.sendMessage({ target: 'ui', type, payload });
}
