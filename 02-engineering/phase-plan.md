---
Title: MeetingMind - Engineering Phase and Sprint Plan
Version: 1.0.0
Status: Approved
Owner: Project Manager
Last Updated: 2026-07-15
Dependencies:
  - 00-project/roadmap.md
  - 02-engineering/jira-tickets.md
  - 02-engineering/jira-task-breakdown.md
  - 02-engineering/jira-api-contracts.md
  - 01-product/requirements-traceability.md
Related Documents:
  - 02-engineering/branching-strategy.md
  - 02-engineering/commit-guidelines.md
  - 06-testing/testing-strategy.md
---

# MeetingMind Engineering Phase and Sprint Plan

## 1. Purpose and Authority

This document converts the approved v1 Jira backlog into a dependency-aware delivery sequence. It
prevents backend, frontend, extension, AI, database, and DevOps work from integrating against
unstable foundations.

The planning hierarchy is:

```text
Release -> Phase -> Two-week sprint -> Jira ticket -> Implementation subtask
```

This plan schedules work; it does not redefine it. `02-engineering/jira-tickets.md` remains the
authority for ticket title, assignee, points, description, and acceptance criteria.
`02-engineering/jira-task-breakdown.md` remains the implementation and dependency guide, and
`02-engineering/jira-api-contracts.md` remains authoritative for endpoint contracts. When scope or
acceptance criteria change, update the owning source before changing this schedule.

Sprint dates are assigned when the team starts a sprint. Sprint identifiers below define sequence,
not an unapproved calendar commitment.

## 2. Status and Capacity Rules

Ticket status in Jira is authoritative. Repository observations in this document are planning
evidence only and must not silently overwrite Jira.

| Status | Meaning |
|---|---|
| Planned | Acceptance criteria exist, but implementation has not started. |
| Ready | Entry dependencies and required contracts are approved. |
| In progress | Implementation or verification is incomplete. |
| Blocked | A named dependency prevents meaningful progress. |
| Done | Acceptance criteria and required verification evidence pass. |

Planning rules:

- Use two-week sprints.
- Each ticket has one accountable Jira assignee, even when other team members contribute subtasks.
- Each person owns at most one primary in-progress ticket at a time unless the team explicitly
  records an exception during sprint planning.
- Story points are counted only when the whole ticket meets its acceptance criteria; partial work
  does not earn partial points.
- Unfinished tickets return to planning with their remaining dependency and risk recorded. They are
  not automatically carried into the next sprint.
- A later phase may start only when its specific entry gate is green. Phase names alone do not
  authorize bypassing ticket dependencies.

## 3. Current Baseline

Repository evidence as of 2026-07-15 supports the following planning snapshot:

| Ticket | Observed state | Evidence or remaining gap |
|---|---|---|
| MM-101 | In progress | Repository scaffolds exist, but no GitHub Actions workflow is present. |
| MM-102 | Done | Next.js scaffold, semantic styling, and base UI components exist and build. |
| MM-103 | Done | FastAPI/Poetry scaffold, health routes, settings, logging, lint, typing, and tests pass. |
| MM-104 | Planned | The production Dockerfiles and root Compose bundle do not exist. |
| MM-201 | Done | Canonical SQLAlchemy models and relationship tests are implemented. |
| MM-202 | Done | Alembic is configured and the development schema is at the current migration head. |
| MM-203 | Done | Database-backed bootstrap, invitation registration, password reset, login, refresh, logout, and current-user flows pass automated and development smoke tests. |
| MM-204 | In progress | Login, bootstrap registration, recovery pages, session hydration, and guards exist; invitation registration UI and remaining edge states are incomplete. |
| MM-601 | Done | `TranscriptChunk.embedding Vector(768)` and the HNSW cosine index exist in the reviewed migration. |
| All other v1 tickets | Planned | Do not infer completion from mock UI or documentation coverage. |

The team is operating across the end of Sprint S1 and the preparation of Sprint S2, but Phase 0 has
known gate debt in MM-101. MM-104 begins with enabling infrastructure subtasks early and closes only
in Sprint S10 because its acceptance criteria require the complete v1 stack and end-to-end release
evidence.

## 4. Phase Overview

| Phase | Goal | Scheduled sprints | Ticket set | Entry gate | Exit gate |
|---|---|---|---|---|---|
| Phase 0 - Foundation and Data | Establish buildable applications, CI, canonical persistence, migrations, and vector capability. | S0, with MM-104 enabling work continuing | MM-101, MM-102, MM-103, MM-201, MM-202, MM-601; MM-104 enabling subtasks | Approved stack and repository conventions | CI runs required checks; clean database migration passes; frontend/backend build locally; no secrets committed. |
| Phase 1 - Identity and Workspace Security | Deliver first-run setup, invitation-only membership, sessions, RBAC, and profile security. | S1-S2 | MM-203-MM-206 | Phase 0 schema and auth contracts are stable | Browser and API auth flows pass; workspace isolation and role denial tests pass; password/profile changes revoke required sessions. |
| Phase 2 - Capture and Ingestion Surfaces | Connect the extension, capture Google Meet tab audio, and support approved fallback ingestion paths. | S3-S4 | MM-301-MM-307 | MM-205 authorization is complete; storage and realtime contracts are approved | Extension capture follows protocol 1.0; reconnect/gap behavior passes; imports and standalone fallback are isolated and verified. |
| Phase 3 - Local AI Processing | Turn acknowledged audio into speaker-aware transcripts and cited rolling outputs using local services. | S5-S7 | MM-401-MM-405 | Capture frames and meeting lifecycle events are stable | Idempotent ingestion, STT/diarization, LLM extraction, lineage, citations, retries, and realtime events pass deterministic tests. |
| Phase 4 - Meeting Console and Knowledge Workflows | Replace mock screens with persisted meeting, transcript, summary, playback, action, and export flows. | S5-S8 | MM-501-MM-506 | Owning API contract is approved; each integration waits for its backend dependency | Refresh preserves server data; citations/timestamps work; actions persist; export contains only authorized current data. |
| Phase 5 - Retrieval and Ask AI | Deliver embeddings, workspace keyword search, semantic answers, and exact citations. | S8-S10 | MM-601-MM-606 | Final transcript persistence is stable; MM-601 schema gate is already complete | Retrieval is workspace-filtered; answers cite exact transcript sources; keyword and semantic search are clearly separated. |
| Phase 6 - Release Hardening | Prove the complete privacy-first self-hosted v1 on a clean supported host. | S10 | MM-104 closure plus cross-cutting release defects | All feature phase exit gates are green | Compose, TLS/WSS, migrations, backup/restore, restart persistence, accessibility, performance, security, and no-egress checks pass. |

Phase 3 and Phase 4 deliberately overlap after their individual API/event contracts are approved.
This lets frontend work proceed against stable mocks while preventing mock data from being reported as
an integrated feature. Phase 5 begins its embedding work only after final transcript persistence is
available.

## 5. Proposed Sprint Allocation

The allocation includes all 131 currently estimated v1 points exactly once. Points guide capacity;
dependency gates and acceptance criteria control delivery.

| Sprint | Sprint goal | Tickets | Points | Primary owners | Required dependency at sprint start |
|---|---|---|---:|---|---|
| S0 | Establish repository, application, data, and vector foundations. | MM-101, MM-102, MM-103, MM-201, MM-202, MM-601 | 14 | Arnish, Prashant, Rudra | None; MM-101 conventions apply to all later work. |
| S1 | Complete database-backed authentication and browser session foundations. | MM-203, MM-204 | 8 | Rudra, Prashant | MM-102, MM-201, MM-202. |
| S2 | Close workspace authorization and authenticated account security. | MM-205, MM-206 | 6 | Jenil | MM-203; MM-206 also requires the usable MM-204 session flow. |
| S3 | Establish storage, extension sessions, capture UI, and console connection settings. | MM-301, MM-302, MM-303, MM-306 | 13 | Arnish, Rudra, Prashant | MM-205 for workspace-bound endpoints; approved realtime protocol. |
| S4 | Integrate tab-audio streaming and both fallback ingestion surfaces. | MM-304, MM-305, MM-307 | 11 | Jenil, Prashant | MM-301-MM-303; Chrome offscreen ownership and stream acknowledgement contracts frozen. |
| S5 | Establish job execution, streaming ingestion, and a real persisted dashboard list. | MM-401, MM-402, MM-501 | 9 | Arnish, Rudra, Prashant | MM-304 for audio frames; MM-201 for meeting persistence. |
| S6 | Produce speaker-aware transcripts and integrate the transcript viewer. | MM-403, MM-503 | 16 | Rudra, Prashant | MM-402; transcript segment/event contract approved before UI integration. |
| S7 | Produce cited AI outputs and synchronize meeting details, realtime events, and playback. | MM-404, MM-405, MM-502, MM-504 | 18 | Rudra, Jenil, Prashant | MM-403; MM-301 for retained media playback. |
| S8 | Deliver actionable meeting outputs and start final transcript embedding. | MM-505, MM-506, MM-602 | 12 | Prashant, Jenil, Rudra | MM-502-MM-503; MM-601; final transcript state is stable. |
| S9 | Deliver semantic API/UI and independent workspace keyword search. | MM-603, MM-604, MM-606 | 13 | Rudra, Prashant | MM-602 for Ask AI; MM-205 for workspace authorization. |
| S10 | Integrate citations and prove the complete self-hosted release. | MM-104, MM-605 | 11 | Arnish, Jenil | MM-603-MM-604 and every feature phase exit gate. |

MM-104 is the only planned multi-phase exception. Its Dockerfile, local-service, routing, and
environment subtasks should be demonstrated incrementally, but the eight ticket points are counted
only in S10 after every MM-104 acceptance criterion passes. If Jira administration permits, split
MM-104 into independently verifiable subtasks without changing its parent acceptance criteria.

## 6. Conflict-Prevention Rules

### 6.1 Contract before parallel implementation

- Freeze the ticket's request, response, error, event, and authorization contract before frontend,
  extension, and backend implementation proceed in parallel.
- Any API contract change during a sprint requires the backend owner and every current consumer to
  approve the change and update contract tests in the same pull request.
- Frontend mocks must use the approved API types and be labeled as mocks. A mock-only page does not
  satisfy an integration acceptance criterion.

### 6.2 Shared-file ownership

| Shared surface | Accountable owner | Coordination rule |
|---|---|---|
| SQLAlchemy models and domain services | Rudra | Coordinate schema fields with Arnish before migration generation. |
| Alembic migrations, database roles, and environment promotion | Arnish | Only one migration-changing branch may be active at a time; staging changes follow reviewed development verification. |
| Next.js pages and reusable UI | Prashant | Jenil coordinates API/state changes before shared store or client edits. |
| API hooks, client state, and cross-surface integration | Jenil | Contract types must match backend response tests. |
| Jira scope and acceptance criteria | Project Manager | Scope changes are recorded before implementation changes. |

Shared files are not edited concurrently without an agreed owner. Prefer one ticket per branch and
small pull requests into `main`; do not create long-lived phase branches.

### 6.3 Integration and handoff

- Producers document a handoff artifact: migration revision, OpenAPI/event contract, typed client
  interface, fixture, or deployment command.
- Consumers verify that artifact before marking their dependent ticket Ready.
- Every phase ends with one integrated demonstration using persisted data, not only isolated unit
  tests or mock screens.
- Defects that violate workspace isolation, citation integrity, token secrecy, or no-content-egress
  block the phase regardless of remaining point capacity.

## 7. Phase Completion Checklist

A phase is complete only when:

- Every phase ticket is Done or explicitly removed through approved backlog change control.
- Acceptance criteria have named automated or manual evidence.
- Required backend lint, typing, tests, frontend/extension lint and build, and relevant E2E checks
  pass.
- Database migrations upgrade from the previous supported revision and pass drift checks.
- Workspace isolation, secrets, local-only provider defaults, and citation requirements are tested
  where applicable.
- Documentation and `PROJECT_MEMORY.md` reflect material implementation decisions.
- The next phase's contracts, dependencies, fixtures, and environment are Ready.

## 8. Sprint Planning and Review Cadence

At sprint planning:

1. Confirm the previous phase gate and current production of handoff artifacts.
2. Recheck Jira status, dependencies, assignees, and available capacity.
3. Pull only tickets whose entry dependencies are green.
4. Break tickets into owner-visible subtasks without changing acceptance criteria.
5. Record risks, integration owner, verification command, and expected demonstration.

At sprint review:

1. Demonstrate accepted behavior against the intended environment.
2. Record passed evidence and unresolved defects.
3. Return incomplete work to planning without partial points.
4. Update this plan only when sequence, capacity assumptions, or a phase gate materially changes.
