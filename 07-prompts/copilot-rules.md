---
Title: MeetingMind — Prompts: Copilot Rules
Version: 1.0.0
Status: Approved
Owner: Lead Developer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind: GitHub Copilot Prompts

## 1. Overview
GitHub Copilot (and Copilot Chat) works best when provided with explicit context. Since it lacks a global project awareness feature like `.cursorrules` (unless configured via Workspace), use these explicit prompt snippets when asking Copilot Chat to generate code for MeetingMind.

## 2. Generating a New Frontend Component

**Prompt for Copilot Chat:**
> "Generate a new React component named `[ComponentName]` in TypeScript. It will be used in a Next.js App Router project. Use Tailwind CSS for styling and follow the shadcn/ui design patterns. Ensure the component accepts a `className` prop and merges it using the `cn` utility. Make it accessible and include a dark mode variant. Only output the code, no explanation."

## 3. Generating a FastAPI Endpoint

**Prompt for Copilot Chat:**
> "Write a FastAPI endpoint for `[HTTP_METHOD] /api/v1/[resource]`. 
> 1. Use the `APIRouter`.
> 2. Accept a Pydantic model for the payload.
> 3. Inject an `AsyncSession` database dependency.
> 4. Ensure it includes standard error handling (HTTPException) if the resource is not found.
> 5. Make it asynchronous."

## 4. Writing Unit Tests

**Prompt for Copilot Chat (Frontend):**
> "Write a Vitest and React Testing Library suite for the `[ComponentName]` component. Test the default rendering state, the interaction when the `[ButtonName]` is clicked, and ensure it correctly handles an empty data array."

**Prompt for Copilot Chat (Backend):**
> "Write a pytest suite for this FastAPI endpoint. Use `TestClient`. Mock the database session and the `get_current_user` dependency. Test the 200 OK happy path and the 404 Not Found error path."

## 5. Inline Autocomplete Tips for MeetingMind
* If Copilot is suggesting raw HTML `<button>`, start typing `<Button variant="` to force it to use the shadcn/ui component instead.
* If Copilot tries to use `useEffect` for data fetching, write `const { data } = useQuery({` to steer it toward TanStack Query.
