---
Title: MeetingMind — Contributing Guide
Version: 2.0.0
Status: Approved
Owner: MeetingMind Engineering Team
Last Updated: 2026-07-27
Dependencies: AGENTS.md, DOCUMENTATION.md
---

# Contributing to MeetingMind

## Before starting

1. Read `AGENTS.md`, `PROJECT_MEMORY.md`, and `.agents/context-map.md`.
2. Find the Jira ticket and acceptance criteria.
3. Read only the documents routed by the context map.
4. Inspect the current implementation; docs may describe unbuilt target behavior.

## Setup

Use the lockfile and manifest inside each application:

```powershell
cd apps/frontend
npm install
npm run dev
```

```powershell
cd apps/extension
npm install
npm run dev
```

```powershell
cd apps/backend
poetry install
poetry run uvicorn app.main:app --reload
```

Copy local settings from the relevant `.env.example`. Never commit `.env` files,
credentials, access tokens, private endpoints, or production meeting content.
The complete production Compose bundle is still a target artifact.

## Implementation rules

- Use ticket branches and small pull requests.
- Keep strict TypeScript and fully typed Python.
- Default Next.js UI to Server Components.
- Use existing shadcn/ui, Radix, and application patterns first.
- Keep FastAPI routes thin and business logic in services.
- Use async SQLAlchemy and enforce workspace isolation.
- Keep AI outputs traceable to transcript citations and processing lineage.
- Do not rewrite unrelated code or documentation.

Detailed conventions live in `02-engineering/`. API-owning tickets also require
`02-engineering/jira-api-contracts.md`.

## Verification

Run all checks from the repository root:

```bash
make ci          # lint + typecheck + test + build for all apps
make lint        # lint only
make typecheck   # type-check only
make test        # tests only
make help        # list all available targets
```

Or run checks for individual applications:

```bash
cd apps/frontend
npm run lint
npm run typecheck
npm run build
```

```bash
cd apps/extension
npm run lint
npm run typecheck
npm run build
```

```bash
cd apps/backend
poetry run ruff check .
poetry run ruff format --check .
poetry run mypy app
poetry run pytest
```

Use real PostgreSQL/pgvector for database integration tests and deterministic
provider fakes in standard CI. Never point automated tests at shared environments.

## Pull requests

- Explain the problem, implementation, risk, and verification.
- Link the Jira ticket and list unmet acceptance criteria.
- Include screenshots or recordings for visible UI changes.
- Update the owning specification when a public contract changes.
- Confirm the diff contains no secrets or sensitive meeting content.

Reviewers prioritize correctness, workspace isolation, citation provenance,
accessibility, failure handling, migrations, and focused tests.

## Branch Protection

The `main` branch requires the following status checks to pass before merge:

| Required check | CI job | What it validates |
|---|---|---|
| `Backend (Ruff · MyPy · pytest)` | `.github/workflows/ci.yml` → `backend` | Ruff lint + format, MyPy strict, pytest |
| `Frontend (ESLint · tsc · build)` | `.github/workflows/ci.yml` → `frontend` | ESLint, TypeScript strict, Next.js build |
| `Extension (ESLint · tsc · build)` | `.github/workflows/ci.yml` → `extension` | ESLint, TypeScript strict, Vite build |

To enable: **Settings → Branches → Branch protection rules → Add rule** for `main`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging → add the three job names above
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

## Security

Do not publish suspected vulnerabilities or sensitive reproduction data publicly.
Use the repository owner's private security-reporting channel or contact a maintainer
privately.
