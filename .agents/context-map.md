# MeetingMind Context Map

Use this file to decide what to read before answering or editing.

## Always Read First

- `PROJECT_MEMORY.md`
- `AGENTS.md`
- `.agents/context-map.md`

## Product Or Planning Questions

Read:

- `00-project/product-overview.md`
- `00-project/vision.md`
- `00-project/roadmap.md`
- `00-project/success-metrics.md`
- `01-product/prd.md`
- `01-product/functional-requirements.md`
- `01-product/acceptance-criteria.md`

## Ticket Implementation

Read:

- `02-engineering/jira-tickets.md`
- `02-engineering/jira-task-breakdown.md`
- The relevant product docs from `01-product/`
- The relevant design docs from `03-design/`
- The relevant backend docs from `04-backend/`
- The relevant testing docs from `06-testing/`

## Frontend Work

Read:

- `02-engineering/folder-structure.md`
- `02-engineering/coding-standards.md`
- `02-engineering/state-management.md`
- `03-design/design-system.md`
- `03-design/accessibility.md`
- Relevant page docs in `03-design/pages/`
- Relevant component docs in `03-design/components/`

Expected implementation style:

- Chrome Extension Manifest V3 for capture surfaces when the task touches meeting capture
- Next.js App Router
- Server Components by default
- shadcn/ui and Radix for primitives
- Tailwind semantic tokens
- lucide-react for icons
- TanStack Query for server state
- Zustand for local-only UI state

## Backend Work

Read:

- `00-project/architecture-overview.md`
- `01-product/trd.md`
- `02-engineering/api-design.md`
- `02-engineering/error-handling.md`
- `02-engineering/authentication.md`
- `02-engineering/authorization.md`
- `04-backend/api-specification.md`
- `04-backend/database-schema.md`
- Relevant backend domain docs in `04-backend/`

Expected implementation style:

- FastAPI routers under `/api/v1`
- Pydantic schemas for validation
- Async SQLAlchemy sessions
- Service layer for business logic
- Celery task entry points should stay thin
- Workspace membership must gate workspace data

## AI Pipeline Or RAG Work

Read:

- `04-backend/ai-pipeline.md`
- `04-backend/transcription.md`
- `04-backend/rag-architecture.md`
- `04-backend/vector-database.md`
- `04-backend/background-jobs.md`
- `04-backend/storage.md`
- `07-prompts/backend-prompts.md`

Important principles:

- Local inference is the default.
- External AI providers are opt-in only unless a task explicitly changes that.
- AI outputs must be cited or traceable to transcript segments.
- Long-running tasks must be idempotent.

## DevOps Work

Read:

- `05-devops/docker.md`
- `05-devops/infrastructure.md`
- `05-devops/environments.md`
- `05-devops/secrets-management.md`
- `05-devops/ci-cd.md`
- `05-devops/monitoring.md`

Expected implementation style:

- Docker Compose for v1
- No secrets in images or committed env files
- Separate API, worker, database, Redis, and storage concerns
- Logs to stdout/stderr

## Testing Work

Read:

- `06-testing/testing-strategy.md`
- `06-testing/unit-testing.md`
- `06-testing/integration-testing.md`
- `06-testing/e2e-testing.md`
- `06-testing/security-testing.md`
- `06-testing/performance-testing.md`
- `06-testing/qa-checklists.md`

Expected testing style:

- Backend: pytest
- Frontend: Vitest
- E2E: Playwright
- Mock AI providers in deterministic CI tests

## Documentation Generation

Read:

- `PROMPT.MD`
- `FOLDER.md`
- `documentgeneration.md`
- `08-resources/templates/`

Expected documentation style:

- Frontmatter on every markdown document
- Enterprise-grade specificity
- Mermaid diagrams where helpful
- Rationale, security, scalability, testing, and accessibility where relevant
