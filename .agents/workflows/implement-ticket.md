# Workflow: Implement Ticket

Use this workflow for Jira tickets, feature requests, or concrete implementation tasks.

## Steps

1. Identify the requested ticket or feature.
2. Read `PROJECT_MEMORY.md`, `AGENTS.md`, and `.agents/context-map.md`.
3. Read `02-engineering/jira-tickets.md` if a ticket ID is involved.
4. Extract acceptance criteria and constraints.
5. Read relevant supporting docs:
   - frontend: `03-design/`, `02-engineering/folder-structure.md`, `02-engineering/coding-standards.md`
   - backend: `04-backend/`, `02-engineering/api-design.md`, `02-engineering/error-handling.md`
   - devops: `05-devops/`
   - tests: `06-testing/`
6. Inspect the current filesystem and existing implementation.
7. Make the smallest implementation that satisfies the criteria.
8. Add or update focused tests when the repo has a test harness.
9. Run practical verification.
10. Update documentation or `PROJECT_MEMORY.md` only if the project understanding changed.

## Guardrails

- Do not invent app structure if a scaffold already exists.
- If `apps/frontend` or `apps/backend` is missing, scaffold only when the task requires it.
- Do not silently choose between conflicting specs when the choice affects API/database contracts.
- Keep generated UI consistent with the documented design system.
- Keep backend routing under `/api/v1`.
- Do not use external AI APIs by default.

## Final Response Shape

Include:

- what changed
- files touched
- verification run
- unresolved blockers or spec conflicts

