---
Title: MeetingMind — Contributing Guide
Version: 1.0.0
Status: Approved
Owner: MeetingMind Engineering Team
Last Updated: 2026-06-28
Dependencies:
  - Node.js >= 20.0
  - Python >= 3.11
  - pnpm >= 9.0
  - Poetry >= 1.8
Related Documents:
  - README.md
  - CHANGELOG.md
  - 00-project/architecture-overview.md
---

# Contributing to MeetingMind

Thank you for your interest in contributing to MeetingMind. This document provides all the information you need to participate effectively — from environment setup through to merge. Please read it in full before opening your first pull request.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Prerequisites](#prerequisites)
3. [Repository Setup](#repository-setup)
4. [Branch Naming Convention](#branch-naming-convention)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
   - [TypeScript / Next.js](#typescript--nextjs)
   - [Python / FastAPI](#python--fastapi)
7. [Commit Message Format](#commit-message-format)
8. [Testing Requirements](#testing-requirements)
9. [Pull Request Process](#pull-request-process)
10. [Review Checklist](#review-checklist)
11. [Issue Templates](#issue-templates)
12. [Security Disclosures](#security-disclosures)

---

## Code of Conduct

All participants in this project are expected to uphold the [Contributor Covenant Code of Conduct v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Violations may be reported to **conduct@meetingmind.dev**. The maintainers take all reports seriously and will respond within 48 hours.

Core expectations:
- Respectful, constructive communication in issues, PRs, and discussions.
- No harassment, discrimination, or dismissal of contributions based on identity.
- Assume good faith; ask for clarification before escalating.

---

## Prerequisites

Ensure the following tools are installed and available on your `PATH` before setting up the repository:

| Tool | Minimum Version | Purpose |
|---|---|---|
| Git | 2.40 | Version control |
| Node.js | 20.0 LTS | Frontend runtime |
| pnpm | 9.0 | Frontend package manager (preferred over npm/yarn for workspace support) |
| Python | 3.11 | Backend runtime |
| Poetry | 1.8 | Python dependency management and virtual environment isolation |
| Docker Engine | 24.0 | Container runtime for integration tests and local infrastructure |
| Docker Compose | 2.20 | Multi-service orchestration |
| Ollama | Latest | Local LLM runtime for AI feature development |

> **Why pnpm?** pnpm's content-addressable store eliminates duplicate packages, reduces `node_modules` size by ~60%, and enforces strict package hoisting rules that prevent phantom dependency bugs.

> **Why Poetry?** Poetry provides deterministic lock files (`poetry.lock`), isolated virtual environments per project, and a unified interface for dependency resolution and publishing — eliminating the class of bugs caused by environment pollution.

---

## Repository Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/<your-username>/meetingmind.git
cd meetingmind

# Add the upstream remote to pull future changes:
git remote add upstream https://github.com/meetingmind/meetingmind.git
```

### 2. Install Frontend Dependencies

```bash
cd frontend
pnpm install
```

### 3. Install Backend Dependencies

```bash
cd backend
poetry install --with dev
```

The `--with dev` flag installs development-only dependencies (`pytest`, `httpx`, `mypy`, `ruff`, `black`) defined in the `[tool.poetry.group.dev.dependencies]` section of `pyproject.toml`.

### 4. Configure Local Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with values appropriate for your local development machine. The CI environment uses its own secrets; never commit `.env.local` or `.env`.

### 5. Start Infrastructure Services

```bash
# Start only the infrastructure dependencies (DB, Redis, MinIO) — not the full app:
docker compose -f docker-compose.dev.yml up -d postgres redis minio
```

### 6. Run Database Migrations

```bash
cd backend
poetry run alembic upgrade head
```

### 7. Start Development Servers

**Terminal 1 — Backend API:**
```bash
cd backend
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Celery Worker:**
```bash
cd backend
poetry run celery -A app.worker worker --loglevel=info --concurrency=2
```

**Terminal 3 — Frontend:**
```bash
cd frontend
pnpm dev
```

The frontend is available at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## Branch Naming Convention

All branches must follow this naming scheme. CI enforces branch name validation via a GitHub Actions workflow.

```
<type>/<ticket-or-scope>/<short-description>
```

### Types

| Type | Usage |
|---|---|
| `feat` | A new user-facing feature |
| `fix` | A bug fix |
| `chore` | Maintenance, dependency updates, tooling |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `security` | Security hardening (use `security/` prefix for sensitive fixes) |

### Examples

```bash
feat/MM-142/semantic-search-ui
fix/MM-201/whisper-timeout-retry
chore/upgrade-nextjs-15
docs/MM-99/api-authentication-guide
refactor/backend/meeting-repository-layer
test/frontend/meeting-upload-form
```

> **Rule:** Branches must not contain uppercase letters, spaces, or special characters other than `/` and `-`.

---

## Development Workflow

```
1. Sync main        →  git fetch upstream && git rebase upstream/main
2. Create branch    →  git checkout -b feat/MM-xxx/my-feature
3. Implement        →  Write code + tests
4. Lint & type-check →  pnpm lint && pnpm typecheck (frontend)
                        poetry run ruff check . && poetry run mypy . (backend)
5. Run tests        →  pnpm test && poetry run pytest
6. Commit           →  Conventional Commit format (see below)
7. Push             →  git push origin feat/MM-xxx/my-feature
8. Open PR          →  Target branch: main. Fill in PR template.
9. Address review   →  Respond to comments; push fixup commits
10. Squash & Merge  →  Maintainer merges after approvals
```

---

## Coding Standards

### TypeScript / Next.js

#### General Rules

- **TypeScript strict mode** is non-negotiable. `tsconfig.json` has `"strict": true`. Never use `@ts-ignore` without a comment explaining why, and never use `any` without explicit justification approved in review.
- Prefer `type` over `interface` for object shapes unless declaration merging is required.
- All exported functions and React components must have explicit return types.
- Async functions must handle errors explicitly — no unhandled promise rejections.

#### File Structure

```
frontend/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/             # Route group: unauthenticated pages
│   ├── (dashboard)/        # Route group: authenticated pages
│   └── api/                # Route handlers (BFF layer)
├── components/
│   ├── ui/                 # shadcn/ui base components (do not customise directly)
│   └── features/           # Domain-specific composite components
├── lib/                    # Utilities, API clients, constants
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state slices
└── types/                  # Shared TypeScript type definitions
```

#### Component Conventions

```typescript
// ✅ Good — named export, explicit props type, explicit return type
export type MeetingCardProps = {
  meeting: Meeting;
  onSelect: (id: string) => void;
};

export function MeetingCard({ meeting, onSelect }: MeetingCardProps): React.JSX.Element {
  return <div onClick={() => onSelect(meeting.id)}>{meeting.title}</div>;
}

// ❌ Bad — default export, implicit return type, any prop
export default function Card(props: any) {
  return <div>{props.title}</div>;
}
```

#### Styling

- Use Tailwind utility classes for all styling. No inline `style` attributes except for dynamic values that cannot be expressed as utilities (e.g., computed `transform` values).
- Responsive design: mobile-first (`sm:`, `md:`, `lg:` breakpoints).
- Dark mode: use `dark:` variants. Never hardcode colours that break dark mode.
- Accessibility: every interactive element must have an accessible name via `aria-label`, `aria-labelledby`, or visible text content. Use Radix UI primitives for complex widgets (dialog, dropdown, tooltip).

#### Imports

- Use absolute imports (`@/components/...`) — configured in `tsconfig.json` `paths`.
- Barrel files (`index.ts`) are permitted for `components/ui` but discouraged elsewhere to keep tree-shaking efficient.

---

### Python / FastAPI

#### General Rules

- **`mypy --strict`** is enforced in CI. All functions must have fully annotated signatures. No `Any` without `# type: ignore[assignment]` and a justification comment.
- Use **Pydantic v2 models** for all request/response schemas. Never use raw `dict` at API boundaries.
- Use **SQLAlchemy 2.x** with the `async` session pattern. No synchronous DB calls in async request handlers.
- All database operations must go through the repository layer (`app/repositories/`). Business logic belongs in services (`app/services/`). Route handlers (`app/api/`) should only parse requests and call services.

#### Project Structure

```
backend/
├── app/
│   ├── api/            # FastAPI routers — thin, delegate to services
│   ├── core/           # Config, security, middleware, exceptions
│   ├── db/             # SQLAlchemy engine, session factory, base model
│   ├── models/         # ORM models (SQLAlchemy)
│   ├── repositories/   # Data access layer (no business logic)
│   ├── schemas/        # Pydantic request/response schemas
│   ├── services/       # Business logic (orchestrates repos, AI, tasks)
│   ├── tasks/          # Celery task definitions
│   └── worker.py       # Celery application instance
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/            # Database migration scripts
└── pyproject.toml
```

#### Error Handling

```python
# ✅ Good — raise HTTPException with specific status code and detail
from fastapi import HTTPException, status

async def get_meeting(meeting_id: uuid.UUID, db: AsyncSession) -> Meeting:
    meeting = await meeting_repo.get_by_id(db, meeting_id)
    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting {meeting_id} not found.",
        )
    return meeting

# ❌ Bad — bare exception, no specific status code
async def get_meeting(meeting_id):
    try:
        return db.query(Meeting).get(meeting_id)
    except Exception:
        raise HTTPException(status_code=500)
```

#### Linting and Formatting

```bash
# Format
poetry run black .
poetry run isort .

# Lint (Ruff covers flake8, pylint, isort rules)
poetry run ruff check . --fix

# Type-check
poetry run mypy .
```

All four commands must pass with zero warnings before pushing.

---

## Commit Message Format

MeetingMind follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Commit messages are validated by `commitlint` in the pre-push Git hook and in CI.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Rules

- **`type`** must be one of: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `security`
- **`scope`** is optional but strongly recommended. Use the affected module: `frontend`, `backend`, `worker`, `db`, `ai`, `auth`, `search`, `upload`, `export`
- **`subject`** is imperative mood, present tense, lowercase, no period at end, ≤ 72 characters
- **`body`** explains *why*, not *what*. Wrap at 100 characters.
- **`footer`** for breaking changes: `BREAKING CHANGE: <description>`. For issue references: `Closes #123`

### Examples

```
feat(ai): add confidence score to action item extraction

Extracted action items now include a confidence score (0.0–1.0) from
the LLM output parser. This allows the frontend to visually signal
low-confidence items for human review.

Closes #142
```

```
fix(worker): retry Whisper transcription on CUDA OOM error

GPU memory exhaustion caused the Celery task to fail permanently.
Added exponential-backoff retry (max 3 attempts) with autoack=False
so the task re-queues rather than being lost.

Closes #201
```

```
feat(auth)!: replace session cookies with JWT access/refresh tokens

BREAKING CHANGE: All existing sessions are invalidated. Clients must
re-authenticate after this deployment. The /api/v1/auth/refresh
endpoint is now required for long-lived sessions.
```

---

## Testing Requirements

All changes must maintain or improve test coverage. The following thresholds are enforced in CI:

| Layer | Framework | Required Coverage |
|---|---|---|
| Frontend unit tests | Vitest + React Testing Library | ≥ 80% statement coverage |
| Frontend E2E tests | Playwright | Critical paths (auth, upload, search) must pass |
| Backend unit tests | pytest | ≥ 85% statement coverage |
| Backend integration tests | pytest + HTTPX async client | All API endpoints covered |

### Running Tests Locally

```bash
# Frontend
cd frontend
pnpm test               # Run unit tests (Vitest)
pnpm test:coverage      # With coverage report
pnpm test:e2e           # Run Playwright E2E (requires running app)

# Backend
cd backend
poetry run pytest                          # All tests
poetry run pytest --cov=app --cov-report=term-missing   # With coverage
poetry run pytest tests/unit/             # Unit only
poetry run pytest tests/integration/      # Integration only (requires DB)
```

### Testing Philosophy

- **Unit tests** must not touch the database, filesystem, or network. Use `unittest.mock` / `pytest-mock` for isolation.
- **Integration tests** use a dedicated test database (seeded by `conftest.py`) and the real FastAPI ASGI app via `httpx.AsyncClient`. They must be idempotent and clean up after themselves.
- **Frontend component tests** test behaviour, not implementation. Avoid testing internal state; test what the user sees and can do.
- **Avoid snapshot tests** for logic-heavy components — they create noise and false confidence.

---

## Pull Request Process

### Before Opening a PR

- [ ] Branch is up to date with `upstream/main`
- [ ] All tests pass locally
- [ ] Lint and type-check pass with zero warnings
- [ ] New code has adequate test coverage
- [ ] Documentation is updated if the change affects user-facing behaviour or API contracts
- [ ] No secrets, credentials, or PII are included in the diff

### PR Title

PR titles must follow the same Conventional Commit format as commit messages. They become the squash-merge commit message.

```
feat(search): implement hybrid BM25 + vector search endpoint
```

### PR Description

Use the PR template at `.github/PULL_REQUEST_TEMPLATE.md`. Fill every section:

1. **What does this PR do?** — Brief, clear description.
2. **Why is this change needed?** — Link to issue or describe the problem.
3. **How was it tested?** — Describe test strategy, not just "I ran tests".
4. **Screenshots / recordings** — Required for any UI change.
5. **Checklist** — Complete the provided checklist.

### Review Requirements

- Minimum **1 approval** from a maintainer for non-trivial changes.
- Minimum **2 approvals** for changes to authentication, authorisation, database schema migrations, or AI pipeline logic.
- CI must be green (all checks passing) before merge.
- Maintainers reserve the right to request revisions or close PRs that do not meet standards.

### Merge Strategy

All PRs are merged via **Squash and Merge**. This keeps `main` history linear and ensures every commit on `main` is a meaningful, atomic change. Your branch commits may be as messy as needed during development — only the final squash message matters.

---

## Review Checklist

Reviewers should evaluate PRs against this checklist:

### Correctness
- [ ] The change correctly implements the intended behaviour
- [ ] Edge cases are handled (null, empty, error states)
- [ ] No race conditions introduced in async code
- [ ] Database transactions are used where atomicity is required

### Security
- [ ] No new SQL injection vectors (use parameterised queries / ORM)
- [ ] No sensitive data logged at INFO level or below
- [ ] Authentication and authorisation checks are present on new endpoints
- [ ] File upload handlers validate MIME type, size, and extension
- [ ] No user-controlled data rendered as raw HTML (XSS)

### Performance
- [ ] No N+1 query patterns (use `selectinload` / `joinedload` in SQLAlchemy)
- [ ] Large datasets are paginated, not fetched in full
- [ ] Expensive operations are offloaded to Celery tasks
- [ ] New indexes added for columns used in WHERE/ORDER BY clauses

### Maintainability
- [ ] Code is DRY — no copy-paste patterns that should be extracted
- [ ] Functions have a single responsibility and are ≤ 40 lines
- [ ] Naming is descriptive and consistent with the existing codebase conventions
- [ ] Complex logic is commented explaining *why*, not just *what*

### Testing
- [ ] New features have corresponding unit and/or integration tests
- [ ] Bug fixes have a regression test that would have caught the original bug
- [ ] Tests are readable and test meaningful behaviour

### Documentation
- [ ] Public API endpoints have updated OpenAPI docstrings
- [ ] New environment variables are documented in `.env.example`
- [ ] README or relevant docs are updated if user-facing behaviour changed

---

## Issue Templates

The repository provides three issue templates in `.github/ISSUE_TEMPLATE/`:

### `bug_report.yml`
Use for reporting unexpected behaviour. Include:
- Steps to reproduce (minimal, reproducible)
- Expected vs actual behaviour
- Environment (OS, browser, Docker version)
- Relevant logs or screenshots

### `feature_request.yml`
Use for proposing new functionality. Include:
- The problem being solved (user story: "As a [role], I want [capability] so that [benefit]")
- Proposed solution
- Alternatives considered
- Acceptance criteria

### `chore.yml`
Use for dependency upgrades, tooling improvements, and technical debt. Include:
- Current state and why it needs changing
- Proposed change
- Testing strategy
- Risk assessment

---

## Security Disclosures

**Do not open public GitHub issues for security vulnerabilities.**

Report security issues to **security@meetingmind.dev** with:
- Detailed description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Any suggested mitigations

We commit to acknowledging reports within 24 hours and providing a remediation timeline within 72 hours. Responsible disclosures are credited in the `SECURITY.md` file unless the reporter requests anonymity.
