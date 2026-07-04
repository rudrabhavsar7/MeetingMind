---
name: spec-sync
description: Reconciles MeetingMind documentation drift, updates related specs after product or architecture decisions, records decisions, and keeps PROJECT_MEMORY.md current. Use when the user asks to align docs, resolve conflicting requirements, update memory, or make the documentation consistent.
---

# Skill: MeetingMind Spec Sync

Use this skill when documentation needs to become consistent.

## Process

1. Read `PROJECT_MEMORY.md`, `AGENTS.md`, `.agents/context-map.md`, and `.agents/workflows/spec-sync.md`.
2. Find all docs that mention the disputed behavior.
3. Apply the source authority order from `AGENTS.md`.
4. Patch the smallest set of files needed.
5. Add a decision entry to `08-resources/decisions-log.md` when a durable product or architecture choice is resolved.
6. Update `PROJECT_MEMORY.md` if the resolved point affects future implementation.

## Decision Entry Shape

Use the existing style in `08-resources/decisions-log.md` if present. Otherwise include:

- date
- decision
- context
- alternatives considered
- consequences
- owner

## Guardrails

- Do not erase useful history.
- Do not hide unresolved conflicts.
- Do not rewrite unrelated docs for style only.

