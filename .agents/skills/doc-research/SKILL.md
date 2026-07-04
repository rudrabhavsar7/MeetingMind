---
name: doc-research
description: Researches and answers MeetingMind project questions by reading the repository documentation first. Use when the user asks what the product does, how a feature should work, where something is specified, what docs say, or asks for a project explanation before implementation.
---

# Skill: MeetingMind Documentation Research

Use repository files as the source of truth.

## Process

1. Read `PROJECT_MEMORY.md`, `AGENTS.md`, and `.agents/context-map.md`.
2. Classify the question: product, frontend, backend, AI pipeline, DevOps, testing, or documentation.
3. Read the relevant docs from the context map.
4. Answer with file citations when useful.
5. If docs conflict, name the conflict and identify the more authoritative source using `AGENTS.md`.

## Rules

- Do not invent facts not present in the repository.
- Keep answers actionable.
- Use absolute dates when discussing roadmap timing.
- For implementation-impacting ambiguity, recommend a decision and say which docs need updating.

