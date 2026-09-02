class MMAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options.processorOptions?.sampleRate || 16000;
    this.chunkDurationMs = options.processorOptions?.chunkDurationMs || 500;
    
    this.chunkSize = Math.floor(this.sampleRate * (this.chunkDurationMs / 1000));
    this.buffer = new Int16Array(this.chunkSize);
    this.bufferIndex = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === 'UPDATE_CHUNK_SIZE') {
        const newDurationMs = event.data.chunkDurationMs;
        const newSize = Math.floor(this.sampleRate * (newDurationMs / 1000));
        if (newSize !== this.chunkSize) {
          const oldBuffer = this.buffer.subarray(0, this.bufferIndex);
          this.chunkSize = newSize;
          this.chunkDurationMs = newDurationMs;
          this.buffer = new Int16Array(this.chunkSize);
          
          if (oldBuffer.length <= this.chunkSize) {
            this.buffer.set(oldBuffer);
          } else {
            // Buffer is larger than new size, flush it
            this.port.postMessage(oldBuffer);
            this.bufferIndex = 0;
          }
        }
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    // We expect mono (1 channel) from the AudioContext since we are routing the stream
    // If there are multiple channels, we could downmix, but taking channel 0 is usually fine for Meeting audio
    const channelData = input[0]; 

    for (let i = 0; i < channelData.length; i++) {
      // Convert Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
      let s = Math.max(-1, Math.min(1, channelData[i]));
      this.buffer[this.bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

      if (this.bufferIndex >= this.chunkSize) {
        // Send a copy of the buffer to the main thread
        this.port.postMessage(new Int16Array(this.buffer));
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('mm-audio-processor', MMAudioProcessor);
