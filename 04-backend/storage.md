---
Title: MeetingMind — Backend: Storage Strategy
Version: 1.2.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-11
Dependencies: 04-backend/data-dictionary.md, 05-devops/infrastructure.md
---

# MeetingMind Backend: Storage Strategy

## 1. Overview
MeetingMind handles massive amounts of unstructured data (video and audio files) alongside structured relational data. A robust storage strategy is required to manage costs, performance, and security.

## 2. Storage Tiers

### 2.1 Relational Storage (PostgreSQL)
* **What:** Users, Workspaces, Meeting Metadata, AI Summaries, Transcripts, Vectors.
* **Why:** ACID compliance, complex querying, relational integrity, vector similarity search.
* **Scaling:** Vertical scaling initially; horizontal read replicas as read volume increases.

### 2.2 Object Storage (MinIO / S3-Compatible Storage)
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
Extension capture does not start with a large file upload. The Chrome extension streams self-framed PCM tab-audio chunks through the acknowledged v1 WebSocket protocol. The backend persists final transcript segments, source app metadata, action items, decisions, and embeddings incrementally.

If the workspace enables raw audio retention, the backend may also write a rolling audio archive to object storage under the meeting path. If retention is disabled, temporary audio buffers must be discarded after transcription and diarization.

## 4. Recording Import Flow (Presigned URLs)
Passing a 2GB imported recording through a FastAPI server blocks async event loops, consumes massive RAM, and incurs double bandwidth costs (Client -> Server -> S3).

**The Solution:**
1. Client asks FastAPI: "I want to import a 2GB file named `q3_meeting.mp4`".
2. FastAPI validates the user, creates a `MediaObject` with a private object key, and generates a short-lived (e.g., 15 min) **presigned PUT URL** from the configured S3-compatible store (MinIO by default).
3. Client uploads the file directly to the object store using the presigned URL.
4. Client tells FastAPI: "Upload finished."
5. FastAPI triggers the Celery pipeline.

## 5. The Download/Streaming Flow
For retained raw media or imported recordings, the FastAPI server should not stream 2GB videos back to the client.
1. UI requests to view a meeting.
2. FastAPI generates a short-lived **Presigned GET URL** for the video file.
3. The UI's `<video src={presigned_url}>` element streams the video directly from S3.
*Note: MinIO/S3 CORS must allow only the configured frontend origins and methods. Presigned URLs are response-time capabilities and must never be persisted in `MediaObject`.*

## 6. Data Lifecycle & Retention
Video storage is expensive.
* **Live Audio Archive:** Optional. If enabled, keep for 30 days by default, then transition or delete based on workspace retention policy.
* **Imported Raw Media:** Keep for 30 days by default, then delete or move to an operator-configured archive tier according to workspace policy.
* **Extracted Audio (WAV):** Delete immediately after the Whisper transcription task completes successfully. Keep the text, dump the WAV.
* **Transcripts & Vectors:** Kept indefinitely in PostgreSQL, as they are very small (text) and form the core value of the RAG system.

## 7. Security
* Buckets MUST be private; anonymous/public access is disabled.
* Access uses backend-generated short-lived presigned URLs or service credentials scoped to the required bucket/prefix.
* Encrypt the underlying volume and use object-store server-side encryption where supported.
* The default MinIO endpoint stays on a private Compose network; only signed object routes needed by the browser are exposed through the controlled deployment boundary.
* External S3-compatible storage is optional and requires explicit endpoint, credential, egress, retention, and data-residency configuration.
