---
Title: MeetingMind — Error and Not-Found Pages
Version: 2.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-27
Dependencies: 02-engineering/error-handling.md, 03-design/design-system.md
---

# Error and not-found pages

## Route errors

`app/error.tsx` is a Client Component that replaces the failed route segment while
preserving the application shell. It shows a generic production-safe explanation
and a retry action wired to Next.js `reset()`. Development may expose additional
diagnostic detail, but production must not display stack traces or secrets.

## Global errors

`app/global-error.tsx` renders a minimal standalone HTML document because the root
layout may be unavailable. It provides a reload action and cannot depend on the
normal application shell.

## Not found

`app/not-found.tsx` handles unmatched routes and resources rejected through
`notFound()`. It uses a neutral "Page not found" message and a primary route to the
dashboard. The message must not reveal whether a protected meeting exists. A
browser-back action may be offered only as a secondary convenience.

## Shared requirements

- Provide one clear heading and recovery action.
- Preserve keyboard focus and accessible names.
- Do not expose raw exception messages, internal IDs, or resource existence.
- Log errors through the approved application logging path with sensitive-data
  redaction.
- Use semantic error tokens and do not rely on color alone.
