export function getCaptureConnectionPlan(): ReadonlyArray<readonly ['tab' | 'microphone', 'worklet' | 'destination']> {
  return [
    ['tab', 'destination'],
    ['tab', 'worklet'],
    ['microphone', 'worklet'],
  ];
}

export function getPcmAudioLevel(samples: Int16Array): number {
  if (samples.length === 0) return 0;
  let sumSquares = 0;
  for (const sample of samples) {
    const normalized = sample / 32768;
    sumSquares += normalized * normalized;
  }
  return Math.min(100, Math.round(Math.sqrt(sumSquares / samples.length) * 100));
}

export function microphonePermissionRequest(): { type: 'OPEN_MIC_PERMISSION_PAGE' } {
  return { type: 'OPEN_MIC_PERMISSION_PAGE' };
}

export function getMicrophonePermissionError(error: unknown): string {
  const name = typeof error === 'object' && error !== null && 'name' in error
    ? String(error.name)
    : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone access was denied. Allow microphone access for MeetingMind in Chrome site settings, then retry capture.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No microphone is available. Connect a microphone or enable one, then retry capture.';
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'Microphone could not start. Close other apps using it, then retry capture.';
  }
  return 'Microphone could not start. Check Chrome microphone permission and device availability, then retry capture.';
}
