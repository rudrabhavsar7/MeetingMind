import assert from 'node:assert/strict';
import test from 'node:test';

import { getCaptureConnectionPlan, getMicrophonePermissionError, getPcmAudioLevel, microphonePermissionRequest } from '../src/capture/audio-capture.ts';

test('capture routes tab and microphone into worklet while only tab reaches speakers', () => {
  assert.deepEqual(getCaptureConnectionPlan(), [
    ['tab', 'destination'],
    ['tab', 'worklet'],
    ['microphone', 'worklet'],
  ]);
});

test('PCM audio level reports normalized RMS percentage', () => {
  assert.equal(getPcmAudioLevel(new Int16Array([0, 0, 0])), 0);
  assert.equal(getPcmAudioLevel(new Int16Array([32767, 32767, 32767, 32767])), 100);
  assert.equal(getPcmAudioLevel(new Int16Array([-16384, 16384])), 50);
});

test('microphone errors explain how to grant permission and retry', () => {
  assert.match(getMicrophonePermissionError({ name: 'NotAllowedError' }), /allow microphone access/i);
  assert.match(getMicrophonePermissionError({ name: 'NotFoundError' }), /connect a microphone/i);
  assert.match(getMicrophonePermissionError(Object.assign(new Error('device busy'), { name: 'NotReadableError' })), /close other apps/i);
});

test('denied microphone permission routes permission page request through service worker', () => {
  assert.deepEqual(microphonePermissionRequest(), {
    type: 'OPEN_MIC_PERMISSION_PAGE',
  });
});
