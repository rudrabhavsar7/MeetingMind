import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAudioFrame,
  buildCaptureControl,
  buildPipelineEventsUrl,
  buildStreamHello,
  nextAudioFrameStartOffset,
  normalizeTranscriptEvent,
  pipelineAuthSubprotocols,
  replayFrame,
} from '../src/capture/stream-protocol.ts';
import { BoundedReplayBuffer } from '../src/capture/replay-buffer.ts';
import { isTrustedExtensionSender } from '../src/capture/message-policy.ts';
import { useExtensionStore } from '../src/store/useExtensionStore.ts';

function readSequence(frame: ArrayBuffer): number {
  return new DataView(frame).getUint32(4, false);
}

function readFlags(frame: ArrayBuffer): number {
  return new DataView(frame).getUint16(18, false);
}

test('replay preserves original MM01 sequence and bytes, sets only replay bit', () => {
  const original = buildAudioFrame(17, 8500, new Int16Array(4000).fill(42));
  const copy = replayFrame(original);

  assert.equal(readSequence(copy), 17);
  assert.equal(readFlags(copy), 1);
  assert.deepEqual(new Uint8Array(original).slice(0, 18), new Uint8Array(copy).slice(0, 18));
  assert.deepEqual(new Uint8Array(original).slice(20), new Uint8Array(copy).slice(20));
  assert.equal(readFlags(original), 0);
});

test('buffer expires unacknowledged frames as one explicit gap after sixty seconds', () => {
  const buffer = new BoundedReplayBuffer();
  const first = buildAudioFrame(0, 0, new Int16Array(4000));
  const second = buildAudioFrame(1, 250, new Int16Array(4000));

  buffer.append(first, 1000);
  buffer.append(second, 1250);
  const expired = buffer.evictExpired(62_000);

  assert.deepEqual(expired, [{ type: 'audio_gap', from_sequence: 0, to_sequence: 1, start_offset_ms: 0, end_offset_ms: 500 }]);
  assert.deepEqual(buffer.pendingGaps(), expired);
  assert.deepEqual(buffer.replayFrames(), []);
});

test('contiguous ACK removes acknowledged frames while retaining later frames for replay', () => {
  const buffer = new BoundedReplayBuffer();
  buffer.append(buildAudioFrame(4, 1000, new Int16Array(4000)), 1000);
  buffer.append(buildAudioFrame(5, 1250, new Int16Array(4000)), 1250);

  buffer.acknowledge(4);

  const pending = buffer.replayFrames();
  assert.equal(pending.length, 1);
  assert.equal(readSequence(pending[0]), 5);
  assert.equal(readFlags(pending[0]), 1);
});

test('reconnect hello keeps client identity and resumes after contiguous ACK', () => {
  const hello = buildStreamHello('stable-client-id', 8);

  assert.deepEqual(hello, {
    type: 'stream_hello',
    protocol_version: '1.0',
    client_instance_id: 'stable-client-id',
    resume_from_sequence: 8,
    audio: { encoding: 'pcm_s16le', sample_rate_hz: 16000, channels: 1, recommended_chunk_ms: 500 },
  });
});

test('pause and resume controls preserve elapsed timeline offsets', () => {
  assert.deepEqual(buildCaptureControl('pause', 120_000), { type: 'capture_control', action: 'pause', at_ms: 120_000 });
  assert.deepEqual(buildCaptureControl('resume', 180_000), { type: 'capture_control', action: 'resume', at_ms: 180_000 });
});

test('audio frame timeline ignores early callback jitter and preserves explicit gaps', () => {
  assert.equal(nextAudioFrameStartOffset(null, 551, false), 551);
  assert.equal(nextAudioFrameStartOffset(1051, 1050, false), 1051);
  assert.equal(nextAudioFrameStartOffset(1551, 5000, true), 5000);
});

test('content-script sender cannot access token-bearing extension messages', () => {
  const origin = 'chrome-extension://abcdefghijklmnop/';

  assert.equal(isTrustedExtensionSender('https://meet.google.com/abc-defg-hij', origin), false);
  assert.equal(isTrustedExtensionSender('chrome-extension://abcdefghijklmnop/index.html', origin), true);
  assert.equal(isTrustedExtensionSender(undefined, origin), false);
});

test('audio frame contains only MM01 header and PCM payload, never token text', () => {
  const token = 'secret-extension-session-token';
  const frame = buildAudioFrame(0, 0, new Int16Array(4000));
  const bytes = new TextDecoder().decode(frame);

  assert.equal(bytes.includes(token), false);
  assert.equal(new TextDecoder().decode(new Uint8Array(frame).slice(0, 4)), 'MM01');
  assert.equal(frame.byteLength, 20 + 8000);
});

test('pipeline transcript event names normalize both live-worker and canonical events', () => {
  const legacy = normalizeTranscriptEvent({ type: 'transcript_segment_final', data: { segment_id: 's1', text: 'hello' } });
  const persistedLegacy = normalizeTranscriptEvent({
    type: 'transcript_final',
    data: { speaker_assignment: 'degraded', segment: { id: 's2', speaker_label: 'SPEAKER_UNASSIGNED', text: 'Recovered line.' } },
  });
  const canonical = normalizeTranscriptEvent({ type: 'transcript_interim', data: { text: 'hello' } });
  const persistedFinal = normalizeTranscriptEvent({
    type: 'transcript_final',
    event_id: 'final-event-id',
    meeting_id: 'meeting-id',
    emitted_at: '2026-10-03T00:00:00Z',
    data: {
      id: 'segment-id',
      client_instance_id: 'client-id',
      sequence_number: 7,
      speaker_label: 'SPEAKER_00',
      start_time: 1,
      end_time: 2,
      text: 'We will ship Friday.',
      is_final: true,
      speaker_assignment: 'pyannote',
    },
  });

  assert.deepEqual(legacy, { type: 'transcript_final', data: { segment_id: 's1', text: 'hello' } });
  assert.deepEqual(persistedLegacy, {
    type: 'transcript_final',
    data: { id: 's2', speaker_label: 'SPEAKER_UNASSIGNED', text: 'Recovered line.', speaker_assignment: 'degraded' },
  });
  assert.deepEqual(canonical, { type: 'transcript_interim', data: { text: 'hello' } });
  assert.deepEqual(persistedFinal, {
    type: 'transcript_final',
    data: {
      id: 'segment-id',
      client_instance_id: 'client-id',
      sequence_number: 7,
      speaker_label: 'SPEAKER_00',
      start_time: 1,
      end_time: 2,
      text: 'We will ship Friday.',
      is_final: true,
      speaker_assignment: 'pyannote',
    },
  });
  assert.equal(normalizeTranscriptEvent({ type: 'heartbeat' }), null);
});

test('pipeline subscription keeps JWT in the required subprotocol, never the URL', () => {
  const token = 'jwt.access.token';
  const url = buildPipelineEventsUrl('https://meetings.example/api/v1/', 'workspace-id', 'meeting-id');

  assert.equal(url, 'wss://meetings.example/api/v1/workspaces/workspace-id/meetings/meeting-id/pipeline-events');
  assert.equal(url.includes(token), false);
  assert.deepEqual(pipelineAuthSubprotocols(token), ['meetingmind.auth.v1', token]);
});

test('replayed final transcript event updates existing snippet without duplication', () => {
  const store = useExtensionStore.getState();
  store.clearTranscript();
  const snippet = { id: 'stable-segment-id', speaker: 'SPEAKER_00', text: 'We will ship Friday.', isFinal: true };

  store.addTranscriptSnippet(snippet);
  store.addTranscriptSnippet(snippet);

  assert.deepEqual(useExtensionStore.getState().transcript, [snippet]);
  store.clearTranscript();
});
