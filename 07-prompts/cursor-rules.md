---
Title: MeetingMind — Prompts: Cursor Rules
Version: 1.0.0
Status: Approved
Owner: Lead Developer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind: `.cursorrules`

## 1. Overview
If you are using Cursor IDE to develop MeetingMind, place these instructions in a `.cursorrules` file at the root of the repository. This guarantees that Cursor's AI understands the tech stack, design system, and project boundaries before it starts generating code.

## 2. File Content (`.cursorrules`)

```markdown
# MeetingMind AI Coding Guidelines

You are an expert full-stack developer assisting with the MeetingMind repository.

## Tech Stack
* **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS.
* **UI Components:** shadcn/ui (Radix UI primitives).
* **State Management:** React Query (TanStack Query) for server state, Zustand for local state.
* **Backend:** FastAPI (Python 3.11+), Pydantic, SQLAlchemy, Celery.
* **Database:** PostgreSQL (with pgvector).

## Frontend Rules
1. **App Router Only:** Never create files in a `pages/` directory. Use the App Router `app/` structure.
2. **Server vs Client Components:** Default to Server Components (`page.tsx`, `layout.tsx`). Add `"use client"` only when interactivity (hooks, state, event listeners) is strictly required.
3. **Styling:** Use Tailwind CSS utility classes exclusively. Never write custom `.css` files unless overriding global shadcn variables in `global.css`. Use the `cn()` utility for conditional class merging.
4. **Icons:** Use `lucide-react`.

## Backend Rules
1. **Async First:** Write async endpoints and use `AsyncSession` with SQLAlchemy.
2. **Validation:** Rely strictly on Pydantic models for request/response validation. Do not manually parse JSON.
3. **Routing:** Keep `main.py` clean. Use FastAPI `APIRouter` to structure routes in `src/api/routes/`.

## Design System (MeetingMind Theme)
* Primary brand color is Emerald (`--primary`).
* The UI should feel modern, clean, and spacious.
* Always implement both Light and Dark mode using Tailwind's `dark:` variant and CSS variables.

## Code Generation Etiquette
* Do not apologize or add filler text (e.g., "Here is the code you requested"). Just output the code.
* Always add TypeScript types/interfaces for component props. No `any` types allowed.
* If modifying an existing component, do not remove unrelated comments or logic unless explicitly asked.
```
