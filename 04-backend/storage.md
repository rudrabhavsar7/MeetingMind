---
Title: MeetingMind — Backend: Storage Strategy
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Backend: Storage Strategy

## 1. Overview
MeetingMind handles massive amounts of unstructured data (video and audio files) alongside structured relational data. A robust storage strategy is required to manage costs, performance, and security.

## 2. Storage Tiers

### 2.1 Relational Storage (PostgreSQL)
* **What:** Users, Workspaces, Meeting Metadata, AI Summaries, Transcripts, Vectors.
* **Why:** ACID compliance, complex querying, relational integrity, vector similarity search.
* **Scaling:** Vertical scaling initially; horizontal read replicas as read volume increases.

### 2.2 Object Storage (S3 / Cloud Storage)
* **What:** Optional live-session audio archives, imported recordings (`.mp4`, `.mp3`, `.wav`, `.webm`), extracted audio (`.wav`), exports, user avatars.
* **Why:** Durable storage for binary blobs and generated exports. The primary value remains PostgreSQL transcript/AI data; raw media retention should be configurable.
* **Structure:**
  ```text
  s3://meetingmind-data/
    ├── workspaces/
    │   └── {workspace_id}/
    │       ├── meetings/
    │       │   └── {meeting_id}/
    │       │       ├── raw_video.mp4
    │       │       └── extracted_audio.wav
    │       └── assets/
    │           └── avatar.png
  ```

### 2.3 Ephemeral/Cache Storage (Redis)
* **What:** Celery task queues, Celery result backend, Rate limiting counters, User session state, WebSocket pub/sub channels.
* **Why:** Ultra-fast, in-memory operations. Data here can be lost without catastrophic failure (tasks will just be retried or fail gracefully).

## 3. Real-Time Capture Storage Flow
Extension capture does not start with a large file upload. The Chrome extension streams small tab-audio chunks to the backend over WebSocket/WebRTC. The backend persists final transcript segments, source app metadata, action items, decisions, and embeddings incrementally.

If the workspace enables raw audio retention, the backend may also write a rolling audio archive to object storage under the meeting path. If retention is disabled, temporary audio buffers must be discarded after transcription and diarization.

## 4. Recording Import Flow (Presigned URLs)
Passing a 2GB imported recording through a FastAPI server blocks async event loops, consumes massive RAM, and incurs double bandwidth costs (Client -> Server -> S3).

**The Solution:**
1. Client asks FastAPI: "I want to import a 2GB file named `q3_meeting.mp4`".
2. FastAPI validates the user, generates a short-lived (e.g., 15 min) **Presigned PUT URL** from AWS S3, and returns it to the client.
3. Client uses `axios.put()` to upload the file *directly* to the S3 bucket via the Presigned URL.
4. Client tells FastAPI: "Upload finished."
5. FastAPI triggers the Celery pipeline.

## 5. The Download/Streaming Flow
For retained raw media or imported recordings, the FastAPI server should not stream 2GB videos back to the client.
1. UI requests to view a meeting.
2. FastAPI generates a short-lived **Presigned GET URL** for the video file.
3. The UI's `<video src={presigned_url}>` element streams the video directly from S3.
*Note: S3 must be configured with proper CORS rules to allow the frontend domain to stream media.*

## 6. Data Lifecycle & Retention
Video storage is expensive.
* **Live Audio Archive:** Optional. If enabled, keep for 30 days by default, then transition or delete based on workspace retention policy.
* **Imported Raw Media:** Keep for 30 days, then transition to Glacier/Deep Archive, or delete if the user only cares about the audio/transcript.
* **Extracted Audio (WAV):** Delete immediately after the Whisper transcription task completes successfully. Keep the text, dump the WAV.
* **Transcripts & Vectors:** Kept indefinitely in PostgreSQL, as they are very small (text) and form the core value of the RAG system.

## 7. Security (S3 Bucket Policies)
* The S3 bucket MUST be **Private**. Block all public access.
* The only way to access a file is via a Backend-generated Presigned URL or IAM Role access (for Celery workers pulling the file to process it).
* Implement Server-Side Encryption (SSE-S3 or SSE-KMS) for data at rest.
