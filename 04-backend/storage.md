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
* **What:** Raw Video (`.mp4`), Extracted Audio (`.wav`), User Avatars.
* **Why:** Unlimited scalable storage for large binary blobs. Cheaper than block storage.
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

## 3. The Upload Flow (Presigned URLs)
Passing a 2GB video file through a FastAPI server blocks async event loops, consumes massive RAM, and incurs double bandwidth costs (Client -> Server -> S3).

**The Solution:**
1. Client asks FastAPI: "I want to upload a 2GB file named `q3_meeting.mp4`".
2. FastAPI validates the user, generates a short-lived (e.g., 15 min) **Presigned PUT URL** from AWS S3, and returns it to the client.
3. Client uses `axios.put()` to upload the file *directly* to the S3 bucket via the Presigned URL.
4. Client tells FastAPI: "Upload finished."
5. FastAPI triggers the Celery pipeline.

## 4. The Download/Streaming Flow
Similar to uploads, the FastAPI server should not stream 2GB videos back to the client.
1. UI requests to view a meeting.
2. FastAPI generates a short-lived **Presigned GET URL** for the video file.
3. The UI's `<video src={presigned_url}>` element streams the video directly from S3.
*Note: S3 must be configured with proper CORS rules to allow the frontend domain to stream media.*

## 5. Data Lifecycle & Retention
Video storage is expensive.
* **Raw Video:** Keep for 30 days, then transition to Glacier/Deep Archive, or delete if the user only cares about the audio/transcript.
* **Extracted Audio (WAV):** Delete immediately after the Whisper transcription task completes successfully. Keep the text, dump the WAV.
* **Transcripts & Vectors:** Kept indefinitely in PostgreSQL, as they are very small (text) and form the core value of the RAG system.

## 6. Security (S3 Bucket Policies)
* The S3 bucket MUST be **Private**. Block all public access.
* The only way to access a file is via a Backend-generated Presigned URL or IAM Role access (for Celery workers pulling the file to process it).
* Implement Server-Side Encryption (SSE-S3 or SSE-KMS) for data at rest.
