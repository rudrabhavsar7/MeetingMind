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

Run the checks supported by the affected application:

```powershell
cd apps/frontend
npm run lint
npm run build
```

```powershell
cd apps/extension
npm run lint
npm run typecheck
npm run build
```

```powershell
cd apps/backend
poetry run ruff check .
poetry run mypy .
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

## Security

Do not publish suspected vulnerabilities or sensitive reproduction data publicly.
Use the repository owner's private security-reporting channel or contact a maintainer
privately.
