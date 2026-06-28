---
Title: MeetingMind — Component: Error State
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Error State

## 1. Overview
A fallback UI displayed when a component or page crashes or fails to load data.

## 2. Design Philosophy
Errors happen. When they do, the app should fail gracefully, explain what went wrong without using technical jargon, and offer a way to recover.

## 3. Problem Statement
React apps crash entirely if an unhandled exception occurs during render (the "White Screen of Death").

## 4. UX Goals
* Prevent full app crashes (catch at the component level).
* Provide a "Try Again" button.

## 5. Usage Guidelines
* Use in React Error Boundaries (`error.tsx` in Next.js).
* Use when React Query returns `isError`.

## 6. When to Use
* 500 Server Errors.
* Network disconnections.
* Unhandled render exceptions.

## 7. When NOT to Use
* For form validation errors (Use inline text).
* For 404s (Use the dedicated 404 Page).

## 8. Component Anatomy
* Container (Centered, similar to Empty State).
* Icon (`AlertTriangle` or `XOctagon`).
* Title ("Something went wrong").
* Description (The error message).
* Action Button ("Try again" or "Refresh").

## 9. Variants
* Page-level.
* Component-level (e.g., just one chart failed to load, the rest of the dashboard is fine).

## 10. Sizes
* Adapts to container.

## 11. States
* Static.

## 12. Layout Rules
* Centered flexbox.

## 13. Content Guidelines
* Never show raw stack traces to the end user.
* Log the real error to Sentry/PostHog in the background.

## 14. Icon Rules
* Use `--destructive` colored icons for severe errors.

## 15. Color System
* Icon: `text-destructive`.
* Background: Usually transparent, maybe a faint red tint (`bg-destructive/5`).

## 16. Typography
* Title: `text-lg font-semibold text-foreground`.
* Desc: `text-sm text-muted-foreground`.

## 17. Spacing
* `p-8`.

## 18. Motion
* N/A.

## 19. Accessibility
* Must be focusable so screen readers announce it. `role="alert"`.

## 20. Keyboard Interaction
* Tab to "Try Again" button.

## 21. Responsive Behavior
* Centers in available space.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--destructive`.

## 24. API Specification
```tsx
<ErrorState 
  title="Failed to load transcript" 
  message="Our servers are currently unreachable. Please check your connection."
  onRetry={() => refetch()}
/>
```

## 25. Props Reference
* `title`, `message` (or `error` object), `onRetry`.

## 26. Events
* `onRetry` fires the reset function of the ErrorBoundary or React Query.

## 27. Composition
* Uses Button, Icons.

## 28. AI Usage Guidelines
* If the LLM API fails, show an ErrorState inside the AI block allowing the user to regenerate.

## 29. Error Handling
* This *is* the error handler.

## 30. Edge Cases
* The `onRetry` function fails again. The Error State must safely re-render itself.

## 31. Performance
* Zero cost.

## 32. Security Considerations
* **CRITICAL:** Ensure `error.message` does not leak sensitive backend data (like DB connection strings). Wrap server errors in generic messages on the frontend.

## 33. Analytics Events
* Fire an event to telemetry when this component mounts so we know users are seeing errors.

## 34. Storybook Stories
* Component Level, Full Page.

## 35. Figma Mapping
* `Feedback/ErrorState`

## 36. shadcn/ui Mapping
* Custom component.

## 37. Tailwind Mapping
* `flex min-h-[400px] flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center`

## 38. Implementation Notes
* Next.js `error.tsx` files automatically receive an `error` object and a `reset` function as props. Pass these directly to this component.

## 39. QA Checklist
* Simulate offline mode in DevTools and ensure this state appears instead of a blank screen.

## 40. Acceptance Criteria
* Catches errors, offers retry.

## 41. Future Enhancements
* Add a "Copy Error ID" button so users can send a trace ID to support.

## 42. CTO Notes
* Robust error boundaries are non-negotiable for enterprise software.
