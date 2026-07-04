---
Title: MeetingMind — Changelog
Version: 1.0.0
Status: Approved
Owner: MeetingMind Engineering Team
Last Updated: 2026-06-28
Dependencies: []
Related Documents:
  - README.md
  - 00-project/roadmap.md
---

# Changelog

All notable changes to MeetingMind are documented in this file.

This changelog adheres to [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

> **Format:** Each version section lists changes under `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security` headings. Entries are written in imperative mood, present tense, and reference issue/PR numbers where applicable.

---

## [Unreleased]

### Added
- Export meeting transcripts to DOCX format via the `python-docx` library (#312)
- Command palette (`⌘K` / `Ctrl+K`) for keyboard-driven navigation (#298)
- Dashboard analytics page: daily processing volume, weekly active users chart (#287)
- Email notification on meeting processing completion (#275)
- API key management UI in workspace settings (#261)
- Webhook integration endpoint for external system subscriptions (#259)

### Changed
- Upgraded `@radix-ui/*` to `v2.1.x` across all primitive components (#309)
- Improved Celery task retry strategy: exponential backoff (1s, 4s, 16s) for Whisper failures (#305)
- Refactored embedding pipeline to use the default local BAAI BGE 768-dimensional model, replacing nomic-embed-text (#301)

### Fixed
- Fixed race condition in concurrent recording imports causing duplicate Celery tasks (#318)
- Resolved dark mode flicker on initial page load caused by SSR/hydration mismatch (#315)

---

## [1.0.0] — 2026-06-28

This is the first stable release of MeetingMind. It delivers the complete MVP feature set: live extension capture, recording import fallback, AI-powered analysis, semantic search, and workspace-scoped collaboration.

### Added

#### Authentication & Authorisation
- JWT-based authentication with access token (15-minute TTL) and refresh token (7-day TTL) rotation (#1)
- User registration with email verification flow (#2)
- Password reset via time-limited HMAC-signed email link (#3)
- RBAC with two workspace roles: `OWNER` and `MEMBER`. Owners can manage workspace settings and members; members can create, view, and query meetings (#4)
- HTTP-only, `SameSite=Strict` cookie storage for refresh tokens — eliminates XSS token theft risk (#5)
- Rate limiting on authentication endpoints: 10 requests/minute per IP via Redis sliding window (#6)

#### Workspace Management
- Workspace creation and soft-delete (#10)
- Member invitation via email with 72-hour expiry token (#11)
- Member removal and role update by workspace owner (#12)
- Workspace settings page: name, description, default LLM model selection (#13)

#### Recording Import & Processing Pipeline
- Chunked recording import supporting MP3, MP4, M4A, WAV, OGG, WEBM formats (max 2 GB) (#20)
- MIME type and file extension validation at upload — prevents disguised executable uploads (#21)
- Presigned URL generation for direct browser-to-MinIO streaming upload, reducing backend memory pressure (#22)
- Celery async processing pipeline: `import → transcribe → analyse → embed → index` (#23)
- Real-time processing status updates via server-sent events (SSE) stream to frontend (#24)
- Processing pipeline resumability: failed tasks store progress checkpoints in Redis; partial re-processing on retry (#25)
- Speaker diarization using `pyannote.audio` integrated with Whisper segments (#26)
- Whisper large-v3 transcription with word-level timestamps (#27)
- Automatic language detection — supports 99 languages (#28)

#### AI Analysis Layer
- LLM-powered structured extraction via Ollama with configurable model (Llama 3 / Gemma / DeepSeek) (#30)
- Meeting summary generation: executive summary + detailed section-level breakdown (#31)
- Action item extraction with assignee detection, due date parsing, and confidence score (#32)
- Decision extraction: captures decisions made during the meeting with supporting rationale (#33)
- Topic segmentation: groups transcript segments into named topic clusters (#34)
- LangChain output parser with Pydantic v2 schema validation — guarantees well-formed LLM responses (#35)
- Automatic retry with simplified prompt on LLM JSON parse failure (#36)
- Processing duration tracking stored per meeting for observability (#37)

#### Semantic Search & RAG
- pgvector HNSW index on 1024-dimensional BAAI BGE-M3 embeddings (#40)
- Hybrid search: combines BM25 full-text ranking (PostgreSQL `tsvector`) with cosine vector similarity (#41)
- Reciprocal Rank Fusion (RRF) to merge BM25 and vector result lists (#42)
- Search scoped to workspace — cross-workspace data leakage is impossible by construction (#43)
- RAG Q&A endpoint: retrieves top-k relevant chunks, constructs grounded prompt, returns answer with source citations (#44)
- Maximal Marginal Relevance (MMR) re-ranking to reduce redundant search results (#45)
- Chunk overlap strategy: 512-token chunks with 64-token overlap for context preservation across chunk boundaries (#46)
- Search result highlighting: matched query terms highlighted in snippet display (#47)

#### Meeting Detail View
- Transcript viewer with speaker labels, timestamps, and word-level confidence display (#50)
- Tabbed interface: Overview / Transcript / Action Items / Decisions / Topics / Q&A (#51)
- Action item CRUD: create, assign, mark complete, delete — with workspace member assignment (#52)
- Decision log view with rationale and timestamp (#53)
- Topic timeline: visual representation of topic flow across meeting duration (#54)
- Export to Markdown and PDF (via headless Chromium) (#55)

#### Frontend
- Next.js 15 App Router with React 19, TypeScript strict, and Tailwind CSS v4 (#60)
- Design system: Neutral-first palette, Emerald accent, Outfit typeface, CSS custom property tokens (#61)
- Light / Dark theme with system preference detection and user override — WCAG 2.2 AA contrast ratios (#62)
- Skeleton loaders for all async data states — eliminates layout shift (#63)
- Toast notification system (shadcn/ui Sonner integration) for user feedback (#64)
- Empty state components for meetings list, search, and action items (#65)
- Responsive layout: sidebar collapses to bottom navigation on mobile (<768px) (#66)
- Framer Motion page transitions and micro-animations — all respect `prefers-reduced-motion` (#67)
- Error boundary components with retry capability — no white-screen-of-death (#68)

#### Backend & Infrastructure
- FastAPI 0.111 with full async SQLAlchemy 2.x ORM (#70)
- Alembic migration system — all schema changes are versioned and reversible (#71)
- PostgreSQL 16 with pgvector 0.7 extension (#72)
- Redis 7 for Celery broker, result backend, rate limiting, and SSE pub/sub (#73)
- MinIO for object storage with bucket lifecycle policies for audio file retention (#74)
- Nginx reverse proxy with TLS termination, gzip compression, and static asset caching (#75)
- Docker Compose with named volumes, health checks, and service dependency ordering (#76)
- Structured JSON logging via `structlog` — correlation ID propagated across request → task boundary (#77)
- OpenAPI 3.1 auto-generated documentation with examples at `/docs` and `/redoc` (#78)
- Flower dashboard for Celery task monitoring at port 5555 (#79)
- GitHub Actions CI: lint → type-check → test → build on every PR (#80)

### Changed

- **Project name:** Working title "TranscriptIQ" renamed to "MeetingMind" to better reflect the product vision (#100)
- Replaced `axios` with native `fetch` + custom wrapper in the frontend — removes a 48 KB dependency (#101)
- Replaced `python-jose` with `python-jwt` for JWT handling — `python-jose` has an unfixed CVE-2024-33664 (#102)
- Migrated from `whisper` (OpenAI reference implementation) to `faster-whisper` (CTranslate2 backend) — 3× faster inference, 50% less VRAM (#103)

### Fixed

- Fixed Celery task worker not releasing DB connections after task completion, causing connection pool exhaustion under load (#200)
- Fixed MinIO presigned URL expiry not matching the configured `MINIO_PRESIGNED_URL_EXPIRY` environment variable (#201)
- Fixed SSE stream not closing on client disconnect, causing goroutine-equivalent async task leak (#202)
- Fixed Whisper large-v3 failing silently on audio files with no detectable speech — now returns an explicit empty transcript with a warning flag (#203)
- Fixed dark mode toggle state not persisting across browser sessions (#204)
- Fixed action item extraction returning duplicate items when LLM response contained near-identical phrasing (#205)

### Security

- Applied `Content-Security-Policy` header via Nginx: restricts script sources to `'self'` and nonces for inline scripts — mitigates XSS (#S01)
- Applied `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` headers (#S02)
- Enforced `Strict-Transport-Security` (HSTS) with `max-age=31536000; includeSubDomains` (#S03)
- Imported audio files validated against magic bytes (not just extension) — prevents polyglot file attacks (#S04)
- All database queries use parameterised statements via SQLAlchemy — no raw string interpolation (#S05)
- Workspace isolation enforced at repository layer with mandatory `workspace_id` filter — prevents horizontal privilege escalation (#S06)
- Secrets rotation: `APP_SECRET_KEY` rotation invalidates all outstanding JWTs without downtime via key-id header in token (#S07)
- Docker images use non-root user (`uid=1001`) for all application containers (#S08)
- MinIO access policy restricts the application service account to the `meetingmind` bucket only (#S09)
- Dependency vulnerability scanning via `pip-audit` and `pnpm audit` in CI — fails build on HIGH or CRITICAL CVEs (#S10)

---

## Version History Summary

| Version | Date | Description |
|---|---|---|
| [1.0.0] | 2026-06-28 | Initial stable release — MVP feature complete |

---

[Unreleased]: https://github.com/meetingmind/meetingmind/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/meetingmind/meetingmind/releases/tag/v1.0.0
