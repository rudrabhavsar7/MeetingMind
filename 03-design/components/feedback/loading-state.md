---
Title: MeetingMind — Component: Loading State
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/spinner.md
---

# MeetingMind Component: Loading State

## 1. Overview
A centralized, full-container loading indicator used when `Skeleton` components are too complex to build for a specific view.

## 2. Design Philosophy
If we don't know the shape of the data coming back, we center a spinner and some reassuring text to let the user know the system is working.

## 3. Problem Statement
Blank white screens during API calls make users think the app is frozen.

## 4. UX Goals
* Provide immediate feedback that a transition is happening.

## 5. Usage Guidelines
* Use as a fallback for React Suspense boundaries.
* Use for heavy page transitions.

## 6. When to Use
* `loading.tsx` in Next.js App Router (if not using Skeletons).
* Initializing the application state (e.g., verifying auth token).

## 7. When NOT to Use
* For small inline data fetching (Use Skeletons).
* Inside a button (Use a Spinner directly).

## 8. Component Anatomy
* Container (Centered flexbox).
* Spinner (`Loader2` icon).
* Optional Text (e.g., "Loading workspace...").

## 9. Variants
* Page-level (`min-h-screen`).
* Component-level (`min-h-[200px]`).

## 10. Sizes
* Adapts to container.

## 11. States
* Active.

## 12. Layout Rules
* `flex flex-col items-center justify-center`.

## 13. Content Guidelines
* Text should be generic but reassuring.

## 14. Icon Rules
* `Loader2` from Lucide, usually `h-8 w-8`.

## 15. Color System
* Spinner: `text-primary`.
* Text: `text-muted-foreground`.

## 16. Typography
* `text-sm font-medium animate-pulse`.

## 17. Spacing
* `gap-4` between spinner and text.

## 18. Motion
* Spinner rotates. Text slowly pulses.

## 19. Accessibility
* Should have `role="status"` and `aria-live="polite"`.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Centers in available space.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
export function LoadingState({ text = "Loading..." }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
    </div>
  )
}
```

## 25. Props Reference
* `text`: String (optional).
* `className`: String (for overriding min-height).

## 26. Events
* N/A.

## 27. Composition
* Uses `Spinner`.

## 28. AI Usage Guidelines
* Use when generating the AI Summary ("Analyzing transcript...").

## 29. Error Handling
* Should timeout and render an ErrorState if it spins for > 15 seconds.

## 30. Edge Cases
* N/A.

## 31. Performance
* Very cheap.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Full Page.

## 35. Figma Mapping
* `Feedback/Loading`

## 36. shadcn/ui Mapping
* Custom composition.

## 37. Tailwind Mapping
* `flex flex-col items-center justify-center`

## 38. Implementation Notes
* Don't show the loading state instantly; debounce it by ~200ms. If the network request resolves in 50ms, showing a loading screen creates an ugly flicker.

## 39. QA Checklist
* Throttle network to 3G to ensure it renders correctly.

## 40. Acceptance Criteria
* Centers perfectly, spins smoothly.

## 41. Future Enhancements
* Skeleton is almost always preferred over this. Evolve to Skeletons where possible.

## 42. CTO Notes
* N/A.
