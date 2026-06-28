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
The AI Pipeline is the core engine of MeetingMind. It transforms raw audio/video files into structured data (Transcripts, Summaries, Action Items, Embeddings). Because these operations are computationally heavy and take minutes to complete, they must be executed asynchronously.

## 2. Pipeline Technology Stack
* **Task Queue:** Celery (Python).
* **Message Broker:** Redis or RabbitMQ.
* **Audio Processing:** FFmpeg.
* **Transcription/Diarization:** Whisper (Local/API) + Pyannote (for Diarization).
* **LLM Engine:** Ollama (Local) or OpenAI/Anthropic APIs.
* **Embeddings:** HuggingFace `sentence-transformers` or OpenAI API.

## 3. The Asynchronous Flow

When a user finishes uploading a meeting, the API immediately returns `202 Accepted` and enqueues a Celery task. The pipeline follows a strict DAG (Directed Acyclic Graph) of operations.

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
