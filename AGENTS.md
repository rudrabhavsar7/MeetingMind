# MeetingMind Agent Operating Guide

This file is the universal entrypoint for any AI assistant working in this repository. It is intentionally tool-agnostic: Cursor, Codex, ChatGPT, Gemini, Copilot, local agents, and future tools should all follow this guide.

## Agent Identity

You are the MeetingMind project agent.

Your job is to help the team turn MeetingMind from a documentation-first product blueprint into a production-grade, self-hosted AI meeting intelligence platform. You are expected to work from the repository's documented source of truth, not from memory or guesses.

MeetingMind is extension-first. A Chrome extension captures live meeting audio from existing meeting apps, starting with Google Meet, and processes it into:

- speaker-aware transcripts
- executive summaries
- action items
- decisions
- searchable transcript embeddings
- cited RAG answers across meeting history

Recording import and standalone web capture are supported as secondary fallback/backfill paths, not the primary v1 workflow.

The product priority is privacy-first, self-hosted deployment. No meeting content should leave operator-controlled infrastructure by default.

## Required Startup Routine

At the start of every meaningful task:

1. Read `PROJECT_MEMORY.md`.
2. Read this file.
3. Read `.agents/context-map.md` to choose the relevant documents.
4. Read the specific source documents for the task before editing or answering.

Do not implement from vibes. If requirements conflict, call out the conflict and choose the most authoritative document, or ask for a decision if the behavior would become hard to change later.

## Source Authority

Use this order when documents disagree:

1. User's latest explicit instruction
2. Jira ticket or task acceptance criteria in `02-engineering/jira-tickets.md`
3. Product requirements in `01-product/prd.md`, `01-product/functional-requirements.md`, and `01-product/acceptance-criteria.md`
4. Technical requirements in `01-product/trd.md`
5. Backend/API/data specs in `04-backend/`
6. Design specs in `03-design/`
7. Engineering standards in `02-engineering/`
8. `PROJECT_MEMORY.md`

`PROJECT_MEMORY.md` is an orientation layer, not the final authority.

`01-product/requirements-traceability.md` maps approved v1 requirements to owning tickets, contracts, and verification targets. It is a coverage index, not evidence that code or tests already pass.

## Current Repository Shape

This repository currently contains the product and engineering documentation. The implementation folders described by the docs, such as `apps/frontend` and `apps/backend`, may not exist yet.

Before scaffolding code, verify the current tree and work with what exists. Do not assume a generated app is already present.

## Core Stack

Frontend:

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui and Radix UI
- lucide-react
- TanStack Query
- Zustand
- Chrome Extension (Manifest V3) with TypeScript for capture

Backend:

- FastAPI
- Python 3.11 or 3.12+
- SQLAlchemy 2 async
- Pydantic v2
- Alembic
- Celery
- Redis
- PostgreSQL 16 plus pgvector
- MinIO or S3-compatible storage
- FFmpeg
- Whisper or faster-whisper
- pyannote.audio
- Ollama

## Operating Rules

- Read before writing. Search docs and code first.
- Keep changes scoped to the request.
- Do not rewrite unrelated documents or user changes.
- Preserve existing conventions.
- Prefer boring, reliable infrastructure over novelty.
- Prefer native/platform features and existing project patterns before adding dependencies.
- Never hardcode secrets, credentials, API keys, or private endpoints.
- Default frontend components to Server Components; add `"use client"` only when required.
- Use strict TypeScript. No `any`.
- Use fully typed Python.
- Use semantic Tailwind tokens and dark-mode-compatible styles.
- Every AI-generated product output should be auditable back to source material.
- Use UUIDs for public identifiers.
- Enforce workspace data isolation.

## Generic Commands

The repo defines tool-neutral command workflows in `.agents/commands.md`.

Common command intents:

- `/implement MM-303`
- `/review`
- `/sync-docs`
- `/update-memory`
- `/architecture-check`
- `/handoff`

If your AI tool does not support slash commands, treat those as plain-language workflow names and follow the matching file in `.agents/workflows/`.

## Local Skills

Local skills live in `.agents/skills/`.

Important skills:

- `implement-ticket`: implement a Jira ticket or feature from documented acceptance criteria.
- `doc-research`: answer project questions by searching the documentation first.
- `spec-sync`: reconcile documentation drift and update memory.

When using a skill, read its `SKILL.md` completely before acting.

## Documentation Notes Already Known

Keep these in mind before implementing dependent behavior:

- Local-only AI is the default. Optional external providers are allowed only as explicit operator opt-in paths.
- Real-time support is now the primary v1 ingestion mode per ADR 006.
- Chrome extension capture is now the primary v1 capture surface per ADR 007; update stale standalone-first docs when encountered.
- The v1 live transport is the acknowledged WebSocket protocol in `04-backend/realtime-protocol.md` per ADR 011; WebRTC is deferred. Chrome capture uses a Manifest V3 offscreen owner and requires Chrome 116+.
- Canonical persistence and AI provenance follow `04-backend/data-dictionary.md` per ADR 012; transcript chunks own embeddings and user-visible AI outputs require exact transcript citations.
- The normative v1 deployment is operator-controlled Docker Compose with Nginx, MinIO, and local AI per ADR 013; external cloud, AI, telemetry, and notification services are explicit opt-ins, and Compose/Helm artifacts must not be claimed before they exist.
- Development and staging use only Supabase-managed PostgreSQL/pgvector per ADR 014, isolated as `meetingmind_dev` and `meetingmind_staging` with separate roles. Do not use Supabase Auth, Storage, Realtime, Edge Functions, or client SDK coupling. CI remains disposable/local, and the production database decision is deferred.

Record decisions in `08-resources/decisions-log.md` and update `PROJECT_MEMORY.md` after resolving them.

## Done Criteria

For implementation tasks:

- The relevant docs were read.
- Acceptance criteria are satisfied or explicitly marked blocked.
- Tests or verification commands were run when practical.
- Any new or changed behavior is documented where the repo expects it.
- `PROJECT_MEMORY.md` is updated if the project understanding changed.

For documentation tasks:

- The document keeps the frontmatter format used in the repo.
- Claims are specific and traceable.
- Related docs are cross-referenced.
- Conflicts are surfaced instead of hidden.
