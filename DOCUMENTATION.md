---
Title: MeetingMind Documentation Guide
Version: 1.0.0
Status: Approved
Owner: Engineering
Last Updated: 2026-07-27
Dependencies: AGENTS.md, .agents/context-map.md
---

# Documentation guide

MeetingMind keeps requirements close to their owning discipline. Start with
`AGENTS.md` for authority rules and `.agents/context-map.md` for task-specific
reading.

## Source-of-truth map

| Area | Primary documents |
| --- | --- |
| Product scope | `01-product/prd.md`, `functional-requirements.md`, `acceptance-criteria.md` |
| Ticket scope | `02-engineering/jira-tickets.md`, `jira-api-contracts.md` |
| Delivery order | `02-engineering/phase-plan.md` |
| UI behavior | `03-design/design-system.md`, `03-design/pages/`, and typed frontend code |
| Persistence | `04-backend/data-dictionary.md` |
| HTTP API | `04-backend/api-specification.md` and ticket API contracts |
| Live capture | `04-backend/realtime-protocol.md` |
| Deployment | `05-devops/` and ADR 013 in `08-resources/decisions-log.md` |
| Verification | `06-testing/`, `01-product/requirements-traceability.md` |
| Durable decisions | `08-resources/decisions-log.md` |

When documents disagree, use the authority order in `AGENTS.md`; do not silently
blend conflicting behavior.

## Maintenance rules

- Add a document only when it owns a stable contract that does not fit an existing
  source of truth.
- Prefer a section in an existing document over a new single-topic file.
- shadcn/ui and Radix own generic component behavior. Keep component props in typed
  code and durable product behavior in the owning page or product specification.
- Keep history in Git and the decisions log rather than retaining superseded copies
  in the active documentation tree.
- Update references, `.agents/context-map.md`, and `PROJECT_MEMORY.md` whenever a
  canonical path or durable project understanding changes.
- Every active Markdown specification uses the repository frontmatter format.
