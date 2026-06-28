---
Title: MeetingMind — Performance Optimization
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-06-28
Dependencies: 01-product/non-functional-requirements.md
---

# MeetingMind — Performance Optimization Strategy

Processing 1-hour audio files, running local LLMs, and serving a snappy UI requires deliberate optimization across the entire stack.

## 1. AI Pipeline Optimizations

### 1.1 Whisper Audio Transcription
* **Problem:** Vanilla Whisper is slow on CPUs.
* **Solution:** We use `faster-whisper` (CTranslate2 backend) which is up to 4x faster than OpenAI's implementation.
* **Optimization:** For files >10 mins, the audio is split into 10-minute overlapping chunks using FFmpeg, and processed in parallel by multiple Celery workers if concurrency allows.

### 1.2 LLM Inference (Ollama)
* **Problem:** Summarizing a 60-minute transcript (approx 9,000 words / 12,000 tokens) exceeds the context window of smaller models or takes too long.
* **Solution (Map-Reduce):**
  1. **Map:** Split the transcript into 3,000-token chunks. Ask the LLM to summarize and extract action items from each chunk independently.
  2. **Reduce:** Combine the chunk summaries and ask the LLM to generate one final cohesive Executive Summary.

### 1.3 Vector Search (pgvector)
* **Problem:** Exact Nearest Neighbor (KNN) search does a sequential scan, becoming slow after 100k vectors.
* **Solution:** Apply an `HNSW` (Hierarchical Navigable Small World) index to the embedding column.
  ```sql
  CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
  ```

## 2. Backend API Optimizations

### 2.1 Database Querying
* **N+1 Problem:** Always use `joinedload` or `selectinload` in SQLAlchemy when serializing relations (e.g., loading a Meeting and its Action Items).
* **Pagination:** Use cursor-based pagination (e.g., `WHERE id > last_seen_id LIMIT 50`) instead of `OFFSET` to prevent the database from scanning skipped rows.

### 2.2 Caching (Redis)
* **Frequently Accessed Data:** User profiles, Workspace settings, and RBAC permissions are cached in Redis for 5 minutes.
* **Cache Invalidation:** Any mutation to these resources triggers an explicit Redis `DEL` command.

## 3. Frontend Optimizations (Next.js)

### 3.1 Bundle Size
* Use dynamic imports (`next/dynamic`) for heavy components that aren't immediately visible (e.g., the complex Mermaid diagram renderer or the PDF export library).
* Avoid importing the entire `lodash` library; import specific utility functions (e.g., `import debounce from 'lodash/debounce'`).

### 3.2 React Rendering
* **Memoization:** Wrap complex list rows (like the Transcript segment rows) in `React.memo` to prevent re-rendering when parent state (like the playing audio time) updates.
* **Server Components:** Keep heavy data-transformation logic on the server to reduce the JS shipped to the client.

### 3.3 Media Streaming
* Do not attempt to load a 1GB MP4 into memory or the DOM at once.
* Ensure the backend serves video/audio using HTTP 206 Partial Content headers (Range requests) so the browser can stream the media. MinIO handles this natively via presigned URLs.
