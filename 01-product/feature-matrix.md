---
Title: MeetingMind — Feature Matrix
Version: 1.0.0
Status: Approved
Owner: Senior Product Manager
Last Updated: 2026-06-28
Dependencies: 01-product/prd.md
---

# MeetingMind — Feature Matrix

This document maps all planned features across the first four major version releases. It is used for capacity planning and release management.

## Priority Legend
* **P0:** Critical for launch. Product cannot ship without this.
* **P1:** Highly desired. Should be in launch, but can be fast-followed.
* **P2:** Nice to have. Will be deferred if timeline tightens.
* **P3:** Backlog. No immediate plans to implement.

## 1. Authentication & Workspace

| Feature | Description | Priority | v1.0 | v1.1 | v1.2 | v2.0 |
|---|---|---|---|---|---|---|
| Email/Pass Registration | Standard JWT based auth | P0 | ✅ | | | |
| Password Reset | Email flow for forgotten passwords | P0 | ✅ | | | |
| Default Workspace | Single workspace per deployment | P0 | ✅ | | | |
| Basic Roles | Admin and Member roles | P0 | ✅ | | | |
| Profile Management | Update name, avatar, password | P1 | ✅ | | | |
| Multi-Workspace | Support for user belonging to multiple workspaces | P1 | | | ✅ | |
| Advanced RBAC | Viewer-only roles, granular permissions | P2 | | | ✅ | |
| SSO / SAML | Enterprise auth integrations (Okta, Azure) | P2 | | | | ✅ |

## 2. Ingestion & Upload

| Feature | Description | Priority | v1.0 | v1.1 | v1.2 | v2.0 |
|---|---|---|---|---|---|---|
| Audio Upload | MP3, WAV, M4A up to 2GB | P0 | ✅ | | | |
| Video Upload | MP4, WebM up to 2GB (audio extracted locally) | P0 | ✅ | | | |
| Upload Progress | Real-time % indicator | P1 | ✅ | | | |
| Processing Queue UI | Visual indicator of background task status | P0 | ✅ | | | |
| Automatic Bot Join | Bot that joins Zoom/Meet calls to record | P3 | | | | ✅ |

## 3. Transcription & Audio Processing

| Feature | Description | Priority | v1.0 | v1.1 | v1.2 | v2.0 |
|---|---|---|---|---|---|---|
| Local Transcription | Whisper-based English transcription | P0 | ✅ | | | |
| Basic Diarization | Speaker A, Speaker B separation | P0 | ✅ | | | |
| Multi-Language Support | Whisper translation/transcription for ES, FR, DE | P2 | | ✅ | | |
| Speaker Identification | Rename Speaker A to "Maya", applies historically | P1 | | ✅ | | |
| Audio Playback | Play original audio synced with transcript | P1 | | ✅ | | |

## 4. AI Analysis (Local LLM)

| Feature | Description | Priority | v1.0 | v1.1 | v1.2 | v2.0 |
|---|---|---|---|---|---|---|
| Executive Summary | Auto-generated high-level overview | P0 | ✅ | | | |
| Action Item Extraction | Identify task, assignee, and implicit due date | P0 | ✅ | | | |
| Decision Extraction | Identify formal agreements | P0 | ✅ | | | |
| Custom Prompts | Workspace admins can define custom extraction rules | P2 | | | ✅ | |
| Proactive Agents | AI digests and cross-meeting insights | P3 | | | | ✅ |

## 5. Knowledge Retrieval (Search & RAG)

| Feature | Description | Priority | v1.0 | v1.1 | v1.2 | v2.0 |
|---|---|---|---|---|---|---|
| Keyword Search | Basic Postgres full-text search on titles/transcripts | P0 | ✅ | | | |
| RAG Semantic Search | Ask questions, get AI answers based on all meetings | P0 | ✅ | | | |
| Search Citations | AI answers link directly to source transcript segments | P0 | ✅ | | | |
| Command Palette | Cmd+K for fast global navigation | P1 | | ✅ | | |

## 6. Output & Integration

| Feature | Description | Priority | v1.0 | v1.1 | v1.2 | v2.0 |
|---|---|---|---|---|---|---|
| Export to Markdown | Download raw markdown of summary + actions | P1 | ✅ | | | |
| Export to PDF | Formatted, branded PDF reports | P2 | | ✅ | | |
| Webhooks | Trigger events on meeting processing complete | P1 | | | ✅ | |
| REST API | Public API for external integration | P2 | | | ✅ | |
| Slack Integration | Send meeting summaries directly to Slack channels | P2 | | | | ✅ |
| Jira Integration | Push action items directly to Jira | P2 | | | | ✅ |
