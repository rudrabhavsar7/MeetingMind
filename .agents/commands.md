# Generic Agent Commands

These are tool-neutral command workflows. If an AI tool supports slash commands, use the command names directly. If not, use the command name as a normal instruction.

## `/implement <ticket-or-feature>`

Purpose: implement a Jira ticket or feature.

Workflow:

1. Read `.agents/workflows/implement-ticket.md`.
2. Read `.agents/skills/implement-ticket/SKILL.md`.
3. Locate acceptance criteria in `02-engineering/jira-tickets.md` or product docs.
4. Read relevant design/backend/testing docs.
5. Implement only the requested scope.
6. Run practical verification.
7. Summarize changed files and verification.

## `/review`

Purpose: review code, docs, or a proposed change.

Workflow:

1. Read `.agents/workflows/review.md`.
2. Inspect the actual diff or files.
3. Lead with findings ordered by severity.
4. Include file references and concrete fixes.

## `/sync-docs`

Purpose: reconcile documentation drift or update related docs after a decision.

Workflow:

1. Read `.agents/workflows/spec-sync.md`.
2. Read `.agents/skills/spec-sync/SKILL.md`.
3. Identify source-of-truth conflicts.
4. Patch the minimal docs needed.
5. Record decisions in `08-resources/decisions-log.md` when the change resolves a product or architecture choice.

## `/update-memory`

Purpose: update `PROJECT_MEMORY.md` after meaningful project changes.

Workflow:

1. Read `.agents/workflows/memory-update.md`.
2. Compare changed docs/code against current memory.
3. Update only facts that changed.
4. Keep memory concise and operational.

## `/architecture-check`

Purpose: evaluate whether a proposal or implementation matches MeetingMind architecture.

Workflow:

1. Read `00-project/architecture-overview.md`.
2. Read `01-product/trd.md`.
3. Read the relevant backend/frontend/devops docs.
4. Report mismatches, risks, and recommended corrections.

## `/handoff`

Purpose: produce a compact handoff for another teammate or AI tool.

Workflow:

1. Read `.agents/workflows/handoff.md`.
2. Summarize current objective, relevant docs, changed files, verification, open risks, and next steps.

