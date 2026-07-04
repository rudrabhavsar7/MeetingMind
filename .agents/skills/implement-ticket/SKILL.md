---
name: implement-ticket
description: Implements a MeetingMind Jira ticket or feature by discovering acceptance criteria, reading the relevant product/design/backend/testing documentation, making scoped code changes, and verifying the result. Use when the user says implement, build, scaffold, fix, or names a ticket such as MM-303.
---

# Skill: Implement MeetingMind Ticket

When a user asks you to implement a feature or a Jira ticket, follow these steps.

## Step 1: Load Agent Context

Read:

- `PROJECT_MEMORY.md`
- `AGENTS.md`
- `.agents/context-map.md`
- `.agents/workflows/implement-ticket.md`

## Step 2: Locate the Documentation

Do not write code immediately.

- If a Jira ticket is named, read `02-engineering/jira-tickets.md`.
- If it's a UI component, check `03-design/components/`.
- If it's a page, check `03-design/pages/`.
- If it's an API or backend feature, check `04-backend/api-specification.md`, `04-backend/database-schema.md`, and related backend docs.
- If it affects deployment, check `05-devops/`.
- If it affects behavior, check `06-testing/` for the matching test strategy.

## Step 3: Extract Acceptance Criteria

Write down the criteria in your working notes before editing:

- required behavior
- input/output contracts
- dependencies
- edge cases
- tests or QA expectations
- unresolved spec conflicts

## Step 4: Implement

Inspect the current filesystem first. This repository may still be documentation-only.

Implement using the stack and architecture in `AGENTS.md`.

Rules:

- Keep edits scoped.
- Follow existing patterns.
- Do not create unrelated abstractions.
- Do not silently choose between conflicting specs for database/API contracts.
- Add focused tests when a test harness exists.

## Step 5: Verification

Run practical verification:

- frontend: lint/typecheck/test/build if available
- backend: ruff/mypy/pytest if available
- docs: confirm links and consistency where practical

If verification cannot run because the implementation scaffold does not exist, say that plainly.
