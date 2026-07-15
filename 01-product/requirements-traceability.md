---
Title: MeetingMind — v1 Requirements Traceability Matrix
Version: 1.0.0
Status: Approved
Owner: Product and QA
Last Updated: 2026-07-11
Dependencies: 01-product/functional-requirements.md, 01-product/acceptance-criteria.md, 02-engineering/jira-tickets.md, 02-engineering/jira-api-contracts.md
---

# MeetingMind — v1 Requirements Traceability Matrix

## 1. Purpose and Status Meaning

This matrix is the release-control bridge between approved functional requirements, implementation ownership, contracts, and verification. It proves specification coverage; it does **not** claim that a ticket or automated test is implemented. Jira status and repository evidence remain the implementation truth.

- **Covered:** a v1 requirement has an owning ticket, normative contract/source, and a named verification target.
- **Blocked:** a required decision/contract/owner is missing; v1 cannot release until resolved.
- **Deferred:** explicitly outside v1 and must not be used as v1 acceptance.

## 2. Requirement-to-Delivery Mapping

| Requirement | Owning ticket(s) | Normative contract/surface | Required verification target | Coverage |
|---|---|---|---|---|
| FR-001 First-run bootstrap | MM-203, MM-204 | Auth contracts; `/register` | `AUTH-BOOTSTRAP`: zero-user success, concurrency loser, atomic rollback | Covered |
| FR-002 Password complexity | MM-203, MM-204, MM-206 | Registration/reset/change-password schemas | `AUTH-PASSWORD-POLICY`: weak/boundary/valid cases | Covered |
| FR-003 Invitation registration | MM-203, MM-204, MM-205 | Invitation validate/register contracts | `AUTH-INVITE`: valid, expired, revoked, reused, email mismatch | Covered |
| FR-004 Login | MM-203, MM-204 | `POST /auth/login`; `/login` | `AUTH-LOGIN`: success, generic failure, redirect | Covered |
| FR-005 Session management | MM-203, MM-204 | refresh rotation/cookie contract | `AUTH-SESSION`: rotation, reuse detection, expiry, SameSite | Covered |
| FR-006 Workspace invitations | MM-205 | invitation create/revoke contracts | `RBAC-INVITE`: Owner/Admin allowed; Member/Viewer denied | Covered |
| FR-007 Workspace RBAC | MM-205 | authorization matrix, workspace dependencies | `SEC-WORKSPACE`: role matrix and cross-workspace corpus | Covered |
| FR-008 Single workspace v1 | MM-205 | ADR 010; `GET /workspaces` | `TENANCY-V1`: max-one list; no create/switch route or UI | Covered |
| FR-009 Password reset | MM-203, MM-204 | forgot/reset contracts | `AUTH-RESET`: enumeration, expiry, reuse, session revocation | Covered |
| FR-010 Logout | MM-203, MM-204 | `POST /auth/logout` | `AUTH-LOGOUT`: cookie clear and token reuse denial | Covered |
| FR-011 Extension authentication | MM-302, MM-303, MM-306 | extension connect/capabilities/session contract | `EXT-AUTH`: connect, revoke, expiry, fixed workspace | Covered |
| FR-012 Meeting detection | MM-303 | MV3 manifest/content detection | `EXT-DETECT`: Google Meet vs unsupported page | Covered |
| FR-013 Start extension capture | MM-302, MM-303 | live-create contract; explicit browser gesture | `EXT-START`: permission, one meeting, offscreen ownership | Covered |
| FR-014 Audio streaming | MM-304, MM-402 | `realtime-protocol.md` | `RT-STREAM`: MM01 framing, ordering, ack/dedupe | Covered |
| FR-015 Meeting context sync | MM-302, MM-304 | live-create/source metadata schema | `EXT-CONTEXT`: visible fields saved; unavailable fields nullable | Covered |
| FR-016 Live transcript updates | MM-303, MM-403, MM-405 | transcript WebSocket events | `RT-TRANSCRIPT`: interim replacement, final persistence/order | Covered |
| FR-017 Recording import | MM-301, MM-305, MM-401, MM-403 | import signed-URL contracts; storage policy | `IMPORT-E2E`: valid types/2GB boundary, magic bytes, idempotent completion | Covered |
| FR-018 Standalone capture | MM-307, MM-302, MM-304 | `/meetings/new`; shared live protocol | `WEB-CAPTURE`: permission/device failure and shared reconnect suite | Covered |
| FR-021 Streaming ASR | MM-403 | transcription and live-event contracts | `AI-ASR-LIVE`: local fixture, interim/final timestamps | Covered |
| FR-022 Streaming diarization | MM-403, MM-503 | transcript schema/speaker mapping | `AI-DIARIZATION`: labels, ordering, fallback, rename | Covered |
| FR-023 Import processing | MM-305, MM-401, MM-403 | batch pipeline/background jobs | `AI-IMPORT`: FFmpeg sandbox, chunk merge, retry/idempotency | Covered |
| FR-024 Rolling summaries | MM-404, MM-405, MM-502 | SummaryVersion/citation/event contracts | `AI-SUMMARY`: version append, valid citations before current | Covered |
| FR-025 Action extraction | MM-404, MM-405, MM-502, MM-505 | ActionItem/citation contracts | `AI-ACTION`: structured parse, exact citation, tracker persistence | Covered |
| FR-026 Decision extraction | MM-404, MM-405, MM-502 | Decision/citation contracts | `AI-DECISION`: structured parse and exact citation | Covered |
| FR-027 AI provenance | MM-201, MM-404 | data dictionary; AIProcessingRun | `AI-LINEAGE`: provider/model/prompt/input/run retained | Covered |
| FR-028 Non-destructive regeneration | MM-404, MM-502 | summary version APIs/data dictionary | `AI-REGEN`: idempotency, prior version/citations retained | Covered |
| FR-041 Vector generation | MM-601, MM-602 | TranscriptChunk/vector contract | `RAG-EMBED`: 768 dimensions, content/model version, idempotency | Covered |
| FR-042 Semantic query | MM-603 | Ask AI contract/RAG architecture | `RAG-RETRIEVE`: top-k relevance and workspace prefilter | Covered |
| FR-043 RAG answer | MM-603, MM-604 | SSE answer contract/chat UI | `RAG-ANSWER`: streaming, grounded refusal, safe Markdown | Covered |
| FR-044 RAG citations | MM-603, MM-605, MM-503 | citation resolver/transcript target | `RAG-CITATION`: correct meeting/segment/timestamp; foreign denial | Covered |
| FR-045 Keyword search | MM-606 | workspace search contract; `/search` mode | `SEARCH-KEYWORD`: rank, cursor, escaping, workspace isolation | Covered |
| FR-051 Dashboard feed | MM-501 | meeting list contract; `/dashboard` | `UI-DASHBOARD`: last ten, empty/error/loading, workspace filter | Covered |
| FR-052 Action tracker | MM-505, MM-502 | workspace action-list/item PATCH; `/actions` | `UI-ACTIONS`: filters, permissions, persistence, citation link | Covered |
| FR-053 Transcript viewer | MM-503, MM-504 | transcript/media contracts | `UI-TRANSCRIPT`: virtualization, citation jump, conditional playback | Covered |
| FR-054 Profile management | MM-206 | profile/change-password contracts; `/settings/profile` | `UI-PROFILE`: validation, reauth, revocation, ownership | Covered |
| FR-055 Markdown export | MM-506 | local export contract | `EXPORT-MD`: golden Unicode output, auth, filename/content safety | Covered |

## 3. Cross-Cutting v1 Release Controls

| Control | Owner | Evidence required before release |
|---|---|---|
| Self-hosted default/no content egress | MM-104 plus every provider/storage integration ticket | Clean-host Compose test, network-egress observation, no external credentials required |
| Workspace isolation | MM-205 plus every tenant-scoped API ticket | Automated two-workspace denial tests, including search/vector/action/export paths |
| AI auditability | MM-201, MM-404, MM-603 | Citation constraint tests, lineage persistence, uncited-output rejection |
| Backup and restore | MM-104/future operational subtask | Encrypted backup plus isolated full restore drill with measured RPO/RTO |
| Documentation integrity | Release owner | Link check, frontmatter check, requirement/ticket coverage check, `git diff --check` |

## 4. Explicitly Deferred or Conditional

- Command palette (PRD Req 4.4), profile avatars, Zoom Web, Teams Web, PDF export, and multi-workspace UI are v1.1+ and are not v1 release gates.
- Media playback is v1 only when imported or retained media exists and policy permits it; transcript/summary functionality must work without retained media.
- External AI, cloud storage, hosted telemetry, SMTP delivery, and webhooks are optional operator-enabled integrations. They are not default-v1 dependencies and cannot be used to satisfy local-path verification.
- A production Compose bundle and Dockerfiles are required artifacts but are not yet present. Documentation coverage must not be confused with a deployable release.

## 5. Change Rule

Any new/changed v1 functional requirement must update this matrix in the same change. A requirement cannot be marked Covered without an owning Jira ticket, a normative behavior/API/data surface, and a deterministic verification target. A ticket cannot be marked release-complete solely from manual prose review; implementation/test evidence must be linked from Jira or release notes.
