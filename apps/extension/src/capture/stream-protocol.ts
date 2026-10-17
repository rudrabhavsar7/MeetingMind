export const MM01_HEADER_BYTES = 20;
export const MM01_MAX_SEQUENCE = 0xffff_ffff;
export const MM01_MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export type CaptureAction = 'pause' | 'resume';

export interface AudioGapMessage {
  type: 'audio_gap';
  from_sequence: number;
  to_sequence: number;
  start_offset_ms: number;
  end_offset_ms: number;
}

export function nextAudioFrameStartOffset(
  previousEndOffsetMs: number | null,
  elapsedMs: number,
  gapPending: boolean,
): number {
  if (previousEndOffsetMs === null || gapPending) return Math.max(previousEndOffsetMs ?? 0, elapsedMs);
  return previousEndOffsetMs;
}

export function buildAudioFrame(sequence: number, startOffsetMs: number, pcm: Int16Array): ArrayBuffer {
  const durationMs = pcm.length / 16;
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > MM01_MAX_SEQUENCE) {
    throw new RangeError('MM01 sequence is outside unsigned 32-bit range');
  }
  if (!Number.isInteger(startOffsetMs) || startOffsetMs < 0 || startOffsetMs + durationMs > MM01_MAX_SESSION_DURATION_MS) {
    throw new RangeError('MM01 timeline offset is invalid');
  }
  if (!Number.isInteger(durationMs) || durationMs < 250 || durationMs > 500) {
    throw new RangeError('MM01 duration must be 250-500 ms');
  }

  const frame = new ArrayBuffer(MM01_HEADER_BYTES + pcm.byteLength);
  const view = new DataView(frame);
  view.setUint8(0, 0x4d);
  view.setUint8(1, 0x4d);
  view.setUint8(2, 0x30);
  view.setUint8(3, 0x31);
  view.setUint32(4, sequence, false);
  view.setBigUint64(8, BigInt(startOffsetMs), false);
  view.setUint16(16, durationMs, false);
  view.setUint16(18, 0, false);
  new Uint8Array(frame, MM01_HEADER_BYTES).set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  return frame;
}

export function replayFrame(original: ArrayBuffer): ArrayBuffer {
  if (original.byteLength < MM01_HEADER_BYTES) throw new RangeError('MM01 frame is missing its header');
  const replay = original.slice(0);
  const view = new DataView(replay);
  view.setUint16(18, view.getUint16(18, false) | 1, false);
  return replay;
}

export function readFrameMetadata(frame: ArrayBuffer): {
  sequence: number;
  startOffsetMs: number;
  durationMs: number;
} {
  if (frame.byteLength < MM01_HEADER_BYTES) throw new RangeError('MM01 frame is missing its header');
  const view = new DataView(frame);
  if (view.getUint8(0) !== 0x4d || view.getUint8(1) !== 0x4d || view.getUint8(2) !== 0x30 || view.getUint8(3) !== 0x31) {
    throw new RangeError('MM01 frame has invalid magic bytes');
  }
  return {
    sequence: view.getUint32(4, false),
    startOffsetMs: Number(view.getBigUint64(8, false)),
    durationMs: view.getUint16(16, false),
  };
}

export function buildStreamHello(clientInstanceId: string, lastAcknowledgedSequence: number): Record<string, unknown> {
  return {
    type: 'stream_hello',
    protocol_version: '1.0',
    client_instance_id: clientInstanceId,
    resume_from_sequence: lastAcknowledgedSequence,
    audio: { encoding: 'pcm_s16le', sample_rate_hz: 16000, channels: 1, recommended_chunk_ms: 500 },
  };
}

export function buildCaptureControl(action: CaptureAction, atMs: number): Record<string, unknown> {
  if (!Number.isInteger(atMs) || atMs < 0 || atMs > MM01_MAX_SESSION_DURATION_MS) {
    throw new RangeError('Capture control offset is outside meeting timeline');
  }
  return { type: 'capture_control', action, at_ms: atMs };
}

export function buildAudioGap(
  fromSequence: number,
  toSequence: number,
  startOffsetMs: number,
  endOffsetMs: number,
): AudioGapMessage {
  return {
    type: 'audio_gap',
    from_sequence: fromSequence,
    to_sequence: toSequence,
    start_offset_ms: startOffsetMs,
    end_offset_ms: endOffsetMs,
  };
}

export function websocketSubprotocols(streamToken: string): [string, string] {
  return ['meetingmind.v1', streamToken];
}

export function pipelineAuthSubprotocols(accessToken: string): [string, string] {
  return ['meetingmind.auth.v1', accessToken];
}

export function buildPipelineEventsUrl(apiBaseUrl: string, workspaceId: string, meetingId: string): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const url = new URL(`${base}/workspaces/${encodeURIComponent(workspaceId)}/meetings/${encodeURIComponent(meetingId)}/pipeline-events`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

export function normalizeTranscriptEvent(event: unknown): { type: 'transcript_interim' | 'transcript_final'; data: Record<string, unknown> } | null {
  if (typeof event !== 'object' || event === null) return null;
  const envelope = event as Record<string, unknown>;
  const type = envelope.type;
  if (type !== 'transcript_interim' && type !== 'transcript_final' && type !== 'transcript_segment_interim' && type !== 'transcript_segment_final') return null;
  const eventData = typeof envelope.data === 'object' && envelope.data !== null ? envelope.data as Record<string, unknown> : {};
  const segment = typeof eventData.segment === 'object' && eventData.segment !== null
    ? eventData.segment as Record<string, unknown>
    : {};
  const data = { ...segment, ...eventData };
  delete data.segment;
  return {
    type: type.endsWith('_final') ? 'transcript_final' : 'transcript_interim',
    data,
  };
}
