# MeetingMind Web Console

The MeetingMind web console is a Next.js 15 App Router application for reviewing
meetings, transcripts, cited AI outputs, actions, decisions, and workspace settings.

## Local development

Install dependencies and start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run build
```

## Structure

- `app/` contains route groups and route-local components.
- `components/` contains genuinely shared UI and application components.
- `lib/` contains API and shared utilities.
- `stores/` contains client-only Zustand state.
- `types/` contains shared TypeScript contracts.

Use Server Components by default. Add `"use client"` only for browser APIs,
interactive state, or client-side data libraries. Follow the repository-level
`AGENTS.md` and the frontend-specific `AGENTS.md` before changing the app.

## Configuration

Do not commit secrets. Configure the backend base URL and other environment-specific
values through local environment files and the deployment environment.
