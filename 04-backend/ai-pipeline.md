---
Title: MeetingMind — Backend: AI Pipeline Architecture
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Backend: AI Pipeline Architecture

## 1. Overview
The AI Pipeline is the core engine of MeetingMind. It transforms extension-captured live audio streams into structured data (Transcripts, Summaries, Action Items, Embeddings) while the meeting is happening. The primary v1 mode is **Chrome Extension Real-Time Streaming** via WebSockets/WebRTC, starting with Google Meet. **Asynchronous Batch** via Celery remains available for imported recordings and backfills.

## 2. Pipeline Technology Stack
* **Task Queue:** Celery (Python).
* **Message Broker:** Redis or RabbitMQ.
* **Audio Processing:** FFmpeg.
* **Transcription/Diarization:** Local Whisper-compatible streaming STT + Pyannote/online diarization.
* **LLM Engine:** Ollama by default; external LLM APIs only as explicit opt-in configuration.
* **Embeddings:** Local HuggingFace `sentence-transformers` by default; external embedding APIs only as explicit opt-in configuration.

## 3. The Dual Pipeline Flow

MeetingMind is extension-first and supports standalone web capture plus recording imports as secondary fallbacks.

### 3.1 Extension Real-Time Streaming Flow (WebSockets)
1. **Detection:** Chrome extension detects a supported meeting app tab, starting with Google Meet.
2. **Ingestion:** Extension connects via WebSocket and streams tab audio chunks (e.g., PCM 16kHz).
3. **Context Sync:** Extension sends source app, source URL, visible title, and visible participants when available.
4. **Transcription:** Audio chunks are immediately piped to local streaming Whisper-compatible STT by default. External streaming STT providers are opt-in only.
5. **Rolling Analysis:** As transcript segments complete, they are pushed to a rolling LLM context buffer. The LLM generates live summaries and action items using streaming events.
6. **Vectorization:** Completed segments are vectorized asynchronously in the background.

### 3.2 Asynchronous Batch Flow (Celery)
For imported recordings, the pipeline follows a strict DAG (Directed Acyclic Graph) of operations:

### Stage 1: Audio Extraction & Normalization
1. Input: MP4, WebM, WAV, etc.
2. Action: Run `ffmpeg` to strip video, convert to 16kHz mono WAV (optimal for Whisper).
3. Output: Normalized `.wav` file stored in a temporary/processing bucket.

### Stage 2: Transcription & Diarization
*Note: This is the most GPU-intensive step.*
1. Input: Normalized `.wav`.
2. Action: 
   * Run Whisper model to generate text with word-level timestamps.
   * Run Pyannote.audio to identify speaker changes (Speaker A, Speaker B).
   * Merge the two outputs based on timestamps.
3. Output: JSON array of `TranscriptSegments`. Saved to PostgreSQL.

### Stage 3: LLM Structuring (Map-Reduce)
*Note: Long meetings exceed LLM context windows (e.g., a 2-hour meeting might be 30k tokens, which requires a large context window, or chunking).*
1. Input: Full Diarized Transcript.
2. Action:
   * Prompt the LLM to generate an Executive Summary.
   * Prompt the LLM to extract Action Items (JSON schema).
   * Prompt the LLM to extract Decisions (JSON schema).
3. Output: Database records for Summary, Action Items, and Decisions updated in PostgreSQL.

### Stage 4: Vectorization (Embeddings)
1. Input: Transcript segments.
2. Action: Group segments into logical chunks (e.g., 3-5 sentences overlapping). Pass chunks through the embedding model to generate vectors.
3. Output: `pgvector` columns updated in PostgreSQL.

### Stage 5: Cleanup & Notification
1. Action: Delete temporary `.wav` files.
2. Action: Emit WebSocket event or push notification: "Meeting Processing Complete."

## 4. Error Handling & Retries
* If Stage 1 fails (corrupt file), abort pipeline, set meeting status to `failed`.
* If Stage 3 (LLM) fails due to API rate limits, Celery should use exponential backoff and retry the specific task.

## 5. Infrastructure Considerations
* **CPU vs GPU:** Celery workers running Stage 1 (FFmpeg) and Stage 3/4 (API calls) can run on cheap CPU instances. Stage 2 (Whisper/Pyannote) requires GPUs (T4 or A10G) to process in a reasonable timeframe (e.g., 10x real-time speed).
* **Worker Routing:** Use Celery routing to send GPU-bound tasks to a specific queue (`queue='gpu_tasks'`) and CPU-bound tasks to another (`queue='cpu_tasks'`).

## 6. Local Development (Ollama)
For local development and self-hosted open-source deployments, MeetingMind uses `Ollama`.
* The Celery worker will make REST calls to `http://localhost:11434/api/generate` instead of `api.openai.com`.
* Recommended Local Models:
  * LLM: `llama3` (8B) or `mistral` (7B).
  * Whisper: `whisper.cpp` or standard Python `whisper` library.
