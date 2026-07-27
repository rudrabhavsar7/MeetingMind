---
Title: MeetingMind — Design System
Version: 2.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-07-27
Dependencies: 00-project/vision.md, 03-design/accessibility.md
---

# MeetingMind design system

MeetingMind is a calm, professional, information-dense application. The UI should
help users understand transcripts and act on cited meeting intelligence without
drawing attention to decorative interface chrome.

## Foundation

- Next.js 15, React 19, Tailwind CSS v4, shadcn/ui, and Radix UI
- Lucide React as the only general icon library
- Semantic CSS variables for light, dark, and system themes
- Outfit loaded through `next/font`, with a system sans-serif fallback
- WCAG 2.2 AA as the accessibility baseline

Generic component behavior comes from shadcn/ui and Radix. Typed frontend code owns
component APIs. Page specifications own durable MeetingMind interaction behavior.

## Visual tokens

Use functional token names such as `background`, `foreground`, `card`, `muted`,
`primary`, `destructive`, `border`, `input`, and `ring`. Do not hardcode light-mode
colors where semantic utilities exist.

- Primary: Emerald 500 (`#10b981`), with accessible hover/foreground combinations
- Neutral surfaces: Slate/Zinc scale
- Destructive/error: Rose
- Warning or review-needed: Amber
- Information: Blue
- Base spacing unit: 4px using Tailwind's standard scale
- Standard radius: `0.5rem`
- Transcript/summary reading measure: approximately 65–80 characters
- Main dashboard maximum width: `1280px`

Use color as reinforcement, never as the only status signal. Verify contrast in the
actual theme; palette names alone do not prove WCAG compliance.

## Typography and icons

Use Tailwind's type scale. Body and transcript text starts at `text-base` with
comfortable line height; metadata commonly uses `text-sm`; page headings normally
use `text-2xl` through `text-4xl`. Restrict font weights to regular, medium, and
bold unless an implementation demonstrates a need.

Lucide icons normally use 16px inline, 20px in navigation, and 24–32px for larger
states. Decorative icons are hidden from assistive technology. Icon-only controls
require an accessible name.

## Layout and responsiveness

Use mobile-first Tailwind breakpoints and container-aware behavior where useful.

- Below `md`: replace the desktop sidebar with an accessible sheet or drawer.
- At `md` and above: show the authenticated application sidebar.
- Below `lg`: meeting details use a single-column or tabbed presentation.
- At `lg` and above: meeting details may use transcript and insight panes.
- Tables become readable stacked views or horizontal regions on narrow containers.
- Interactive targets should be at least 44 by 44 CSS pixels on touch surfaces.
- Auth/setup views use a focused centered layout without application navigation.

The browser URL and history remain authoritative for navigable state. v1 uses visible
navigation and search; the command palette is a v1.1 enhancement.

## Feedback, motion, and AI trust

- Prefer skeletons shaped like expected content over blank screens.
- Optimistic updates must roll back and explain recoverable failures.
- Inline validation remains adjacent and programmatically associated with its field.
- Destructive actions require explicit confirmation.
- Most transitions finish within 200ms and explain a state change.
- Respect `prefers-reduced-motion`; motion is never required to understand state.
- AI-generated user-visible claims require exact transcript citations.
- Low-confidence or incomplete outputs use text/icon indicators in addition to color.

## Contribution rules

Before introducing a pattern:

1. Check whether shadcn/ui, Radix, Tailwind, or an existing frontend pattern solves it.
2. Read the owning page specification and accessibility requirements.
3. Keep props and implementation details in strict TypeScript.
4. Document lasting product behavior in the owning page, requirement, API contract,
   or data contract—not in a parallel component manual.
