---
Title: MeetingMind — Component: Empty State
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Empty State

## 1. Overview
A specialized view shown when a list, table, or page has no data to display.

## 2. Design Philosophy
An empty screen looks like a bug. Empty states are an opportunity to guide the user on what to do next (Onboarding).

## 3. Problem Statement
A new user logs in and sees a blank Dashboard. They don't know if the app is broken or what their first action should be.

## 4. UX Goals
* Reassure the user the app is working.
* Provide a clear Call to Action (CTA) to populate the data.

## 5. Usage Guidelines
* Use whenever a data collection (`[]`) returns empty.

## 6. When to Use
* Empty Meeting list.
* Empty Search results.
* No notifications.

## 7. When NOT to Use
* While data is loading (Use `Skeleton` or `Loading State`).
* If an error occurred (Use `Error State`).

## 8. Component Anatomy
* Container (Centered layout, often a dashed border).
* Illustration/Icon (Large, muted).
* Title (Friendly, e.g., "No meetings yet").
* Description (Explains how to add data).
* Primary Action Button (e.g., "Upload Meeting").

## 9. Variants
* Page-level (Large, centered on screen).
* Component-level (Smaller, inside a Card or Table body).

## 10. Sizes
* Adapts to parent container.

## 11. States
* Static.

## 12. Layout Rules
* `flex flex-col items-center justify-center text-center`.

## 13. Content Guidelines
* Keep it positive. Focus on what they *can* do, not what is missing.

## 14. Icon Rules
* Use a large (e.g., `h-12 w-12`) Lucide icon. `text-muted-foreground/50`.

## 15. Color System
* Background is usually `bg-transparent` or `bg-muted/10`.
* Text is `text-foreground` (Title) and `text-muted-foreground` (Description).

## 16. Typography
* Title: `text-lg font-semibold`.
* Desc: `text-sm mt-2 max-w-sm`.

## 17. Spacing
* Padding `p-8` or `p-12`.

## 18. Motion
* Fade in on mount to prevent flashing if data is cached but takes a frame to evaluate.

## 19. Accessibility
* Ensure the CTA button is clearly focused.

## 20. Keyboard Interaction
* Standard tab to the button.

## 21. Responsive Behavior
* Centers in whatever space it has.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--muted-foreground`.

## 24. API Specification
Not a shadcn primitive, but a standard custom component.
```tsx
<EmptyState 
  icon={Calendar} 
  title="No meetings found" 
  description="You haven't uploaded or recorded any meetings in this workspace."
  action={<Button onClick={openUpload}>Upload Meeting</Button>}
/>
```

## 25. Props Reference
* `icon`, `title`, `description`, `action`.

## 26. Events
* N/A.

## 27. Composition
* Combines Icon, Typography, Button.

## 28. AI Usage Guidelines
* If AI search returns no results, the empty state should suggest alternative, broader prompts.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Zero cost.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track clicks on the Empty State CTA to measure onboarding success.

## 34. Storybook Stories
* Page Level, Table Level, Search Results.

## 35. Figma Mapping
* `Feedback/EmptyState`

## 36. shadcn/ui Mapping
* Built custom using basic utility classes.

## 37. Tailwind Mapping
* `flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50`

## 38. Implementation Notes
* Make sure `min-h` is set so it takes up realistic space, preventing the footer from riding up to the header.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Clear CTA provided.

## 41. Future Enhancements
* Custom SVG illustrations instead of Lucide icons for key screens.

## 42. CTO Notes
* Never leave a page completely blank. Always implement this component as the fallback for every `.map()` over an array.
