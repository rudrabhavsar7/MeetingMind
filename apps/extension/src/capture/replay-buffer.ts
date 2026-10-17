import { buildAudioGap, readFrameMetadata, replayFrame, type AudioGapMessage } from './stream-protocol.ts';

interface BufferedFrame {
  bytes: ArrayBuffer;
  sequence: number;
  startOffsetMs: number;
  durationMs: number;
  retainedAt: number;
}

export class BoundedReplayBuffer {
  private readonly frames: BufferedFrame[] = [];
  private readonly gaps: AudioGapMessage[] = [];
  private acknowledgedSequence = -1;
  private readonly maxAgeMs: number;

  constructor(maxAgeMs = 60_000) {
    this.maxAgeMs = maxAgeMs;
  }

  get lastSequence(): number {
    return this.frames.at(-1)?.sequence ?? this.gaps.at(-1)?.to_sequence ?? this.acknowledgedSequence;
  }

  append(frameBytes: ArrayBuffer, retainedAt: number): AudioGapMessage[] {
    const metadata = readFrameMetadata(frameBytes);
    if (metadata.sequence <= this.acknowledgedSequence) return [];
    const existing = this.frames.find((frame) => frame.sequence === metadata.sequence);
    if (existing) return [];
    this.frames.push({
      bytes: frameBytes.slice(0),
      sequence: metadata.sequence,
      startOffsetMs: metadata.startOffsetMs,
      durationMs: metadata.durationMs,
      retainedAt,
    });
    this.frames.sort((left, right) => left.sequence - right.sequence);
    return this.evictExpired(retainedAt);
  }

  acknowledge(highestContiguousSequence: number): void {
    if (!Number.isInteger(highestContiguousSequence) || highestContiguousSequence < this.acknowledgedSequence) return;
    this.acknowledgedSequence = highestContiguousSequence;
    while (this.frames.length > 0 && this.frames[0].sequence <= highestContiguousSequence) this.frames.shift();
    while (this.gaps.length > 0 && this.gaps[0].to_sequence <= highestContiguousSequence) this.gaps.shift();
  }

  evictExpired(now: number): AudioGapMessage[] {
    const expired: BufferedFrame[] = [];
    while (this.frames.length > 0 && now - this.frames[0].retainedAt > this.maxAgeMs) {
      const frame = this.frames.shift();
      if (frame && frame.sequence > this.acknowledgedSequence) expired.push(frame);
    }
    const newGaps: AudioGapMessage[] = [];
    for (const frame of expired) {
      const last = newGaps.at(-1);
      if (last && last.to_sequence + 1 === frame.sequence) {
        last.to_sequence = frame.sequence;
        last.end_offset_ms = Math.max(last.end_offset_ms, frame.startOffsetMs + frame.durationMs);
      } else {
        newGaps.push(
          buildAudioGap(
            frame.sequence,
            frame.sequence,
            frame.startOffsetMs,
            frame.startOffsetMs + frame.durationMs,
          ),
        );
      }
    }
    this.mergeGaps(newGaps);
    return newGaps;
  }

  pendingGaps(): AudioGapMessage[] {
    return this.gaps.map((gap) => ({ ...gap }));
  }

  replayFrames(): ArrayBuffer[] {
    return this.frames.filter((frame) => frame.sequence > this.acknowledgedSequence).map((frame) => replayFrame(frame.bytes));
  }

  framesAfter(sequence: number): ArrayBuffer[] {
    return this.frames.filter((frame) => frame.sequence > sequence && frame.sequence > this.acknowledgedSequence).map((frame) => frame.bytes);
  }

  private mergeGaps(newGaps: AudioGapMessage[]): void {
    for (const gap of newGaps) {
      const previous = this.gaps.at(-1);
      if (previous && previous.to_sequence + 1 === gap.from_sequence) {
        previous.to_sequence = gap.to_sequence;
        previous.end_offset_ms = Math.max(previous.end_offset_ms, gap.end_offset_ms);
      } else {
        this.gaps.push({ ...gap });
      }
    }
  }
}
