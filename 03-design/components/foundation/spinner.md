---
Title: MeetingMind — Component: Spinner
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Spinner

## 1. Overview
A simple, rotating visual element indicating indeterminate loading or processing.

## 2. Design Philosophy
Spinners are a fallback for when Skeletons are inappropriate (e.g., inside a button, or when the layout shape is unknown).

## 3. Problem Statement
The user needs to know the system has registered their click and is actively working on the request.

## 4. UX Goals
* Provide immediate feedback for user actions.

## 5. Usage Guidelines
* Keep it small.
* Use inside buttons during submission.

## 6. When to Use
* Button `isLoading` states.
* Tiny inline fetching (e.g., checking if a workspace name is available).

## 7. When NOT to Use
* For full-page loads (Use Skeletons).
* For long, deterministic processes like file uploads (Use a Progress Bar).

## 8. Component Anatomy
* An SVG icon (usually Lucide `Loader2`).

## 9. Variants
* N/A (Color adapts to text context).

## 10. Sizes
* Usually `16x16px` (w-4 h-4) to fit inside buttons.

## 11. States
* Spinning (`animate-spin`).

## 12. Layout Rules
* Inline flex.

## 13. Content Guidelines
* No text inside the spinner itself.

## 14. Icon Rules
* Use `Loader2` from Lucide React. Avoid custom SVG spinners to keep bundle size down.

## 15. Color System
* Inherits the `currentColor` of the text it sits next to. (e.g., inside a primary button, it will be white).

## 16. Typography
* N/A.

## 17. Spacing
* N/A.

## 18. Motion
* CSS infinite rotation (`animate-spin`).

## 19. Accessibility
* Must be accompanied by `aria-busy="true"` on the parent container, or have screen-reader text.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Fixed size.

## 22. Dark Mode
* Inherits color context.

## 23. Design Tokens
* N/A.

## 24. API Specification
```tsx
import { Loader2 } from "lucide-react"

export const Spinner = ({ className }) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
)
```

## 25. Props Reference
* `className`: String.

## 26. Events
* N/A.

## 27. Composition
* Used heavily inside `Button` and `Card` components.

## 28. AI Usage Guidelines
* When the AI is actively generating text (streaming), do NOT use a spinner. Use a blinking text cursor instead.

## 29. Error Handling
* Must disappear if the underlying operation errors out.

## 30. Edge Cases
* N/A.

## 31. Performance
* Negligible SVG rotation.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Colored, Inside Button.

## 35. Figma Mapping
* N/A (Standard icon).

## 36. shadcn/ui Mapping
* Usually just relies on the Lucide icon directly.

## 37. Tailwind Mapping
* `animate-spin`

## 38. Implementation Notes
* Make sure `animate-spin` uses a linear easing function, not ease-in-out, so the rotation is smooth.

## 39. QA Checklist
* Ensure the spinner is perfectly centered inside buttons.

## 40. Acceptance Criteria
* Rotates infinitely.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* A spinner is an admission of failure in perceived performance. Optimize backend calls so we don't have to show these for long.
