# MeetingMind

MeetingMind is a privacy-first, self-hosted AI meeting intelligence platform.
A Chrome extension captures live meeting audio, starting with Google Meet, and
the web console provides speaker-aware transcripts, summaries, action items,
decisions, recordings, and cited search across meeting history. Recording import
and standalone web capture are secondary fallback paths.

## Start here

- [Documentation map](./DOCUMENTATION.md)
- [Phase and sprint plan](./02-engineering/phase-plan.md)
- [Jira backlog](./02-engineering/jira-tickets.md)
- [Product requirements](./01-product/prd.md)
- [UI design system](./03-design/design-system.md)
- [Database contract](./04-backend/data-dictionary.md)
- [API specification](./04-backend/api-specification.md)
- [Live capture protocol](./04-backend/realtime-protocol.md)

The application scaffolds exist, but production Dockerfiles and the root Compose
bundle are not complete. Do not treat the repository as a working one-command
deployment until the foundation ticket delivers and verifies those artifacts.

## Applications

- `apps/extension`: Chrome Manifest V3 capture extension
- `apps/frontend`: Next.js 15 web console
- `apps/backend`: FastAPI API and backend services

## Core stack

- Frontend: React 19, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, TanStack Query,
  and Zustand
- Backend: FastAPI, async SQLAlchemy, Pydantic, Celery, Redis, and PostgreSQL with
  pgvector
- AI: local Whisper/faster-whisper, pyannote.audio, Ollama, and BGE embeddings
- Infrastructure: operator-controlled Docker Compose with Nginx and MinIO as the
  normative v1 target

External AI, telemetry, notification, and cloud integrations are explicit operator
opt-ins. Meeting content stays inside operator-controlled infrastructure by default.

## Working with agents

Every agent starts with `AGENTS.md`, `PROJECT_MEMORY.md`, and
`.agents/context-map.md`. Local skills support ticket implementation,
documentation-grounded research, and specification synchronization.
