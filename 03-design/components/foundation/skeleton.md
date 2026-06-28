---
Title: MeetingMind — Component: Skeleton
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/experience-tokens.md
---

# MeetingMind Component: Skeleton

## 1. Overview
A placeholder component that mimics the shape of content before it has loaded, creating a perceived performance boost.

## 2. Design Philosophy
Users are more patient when they see progress or structure forming, rather than staring at a static spinning wheel.

## 3. Problem Statement
Fetching a large meeting transcript from the database can take a few hundred milliseconds. The screen popping from blank to full causes a jarring layout shift.

## 4. UX Goals
* Prevent Cumulative Layout Shift (CLS).
* Provide a sense of progress.

## 5. Usage Guidelines
* Use in place of Text, Avatars, or Images during data fetching.
* Group skeletons together to mimic whole components (e.g., a Skeleton Meeting Card).

## 6. When to Use
* During initial page load or heavy client-side data fetching (React Query `isLoading`).

## 7. When NOT to Use
* For very fast operations (< 100ms) where the skeleton would just flash on screen, causing a strobe effect.
* For background mutations (saving data).

## 8. Component Anatomy
* A simple `<div>` with a background color and an animation.

## 9. Variants
* The base component is just a rectangle. Shape is dictated by Tailwind classes applied via props.

## 10. Sizes
* Fully fluid based on applied classes (e.g., `h-4 w-[250px]`).

## 11. States
* Pulsing (Active).

## 12. Layout Rules
* Should perfectly match the layout footprint of the component it is replacing.

## 13. Content Guidelines
* No text.

## 14. Icon Rules
* Mimic icons by using circular skeletons (`rounded-full h-8 w-8`).

## 15. Color System
* `bg-muted` or `bg-primary/10`.

## 16. Typography
* N/A.

## 17. Spacing
* Should match the padding/margins of the real component.

## 18. Motion
* Tailwind's `animate-pulse` (opacity fades in and out).

## 19. Accessibility
* The wrapper containing the skeletons should ideally have `aria-busy="true"` and an `aria-label="Loading content"`.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Adapts to the container size, just like the real component would.

## 22. Dark Mode
* `bg-muted` adjusts automatically.

## 23. Design Tokens
* `--muted`.

## 24. API Specification
```tsx
<Skeleton className="w-[100px] h-[20px] rounded-full" />
```

## 25. Props Reference
* `className`: Used to define width, height, and border radius.

## 26. Events
* N/A.

## 27. Composition
* Heavily composed into "Skeleton Screens" (e.g., `TranscriptSkeleton`).

## 28. AI Usage Guidelines
* When RAG results are fetching, use a skeleton layout that mimics the citation cards.

## 29. Error Handling
* If the fetch fails, the Skeleton must be replaced by an Error state/boundary. Skeletons should not pulse indefinitely.

## 30. Edge Cases
* N/A.

## 31. Performance
* Very cheap CSS animation.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Card Skeleton, Text Block Skeleton, Avatar Skeleton.

## 35. Figma Mapping
* `Core/Skeleton`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add skeleton`

## 37. Tailwind Mapping
* `animate-pulse rounded-md bg-muted`

## 38. Implementation Notes
* Avoid creating highly complex skeleton SVGs. Simple HTML divs with `bg-muted` are easier to maintain and respond better to CSS Grid/Flexbox layouts.

## 39. QA Checklist
* Ensure the skeleton doesn't cause the page layout to shift when the real data swaps in.

## 40. Acceptance Criteria
* Pulses smoothly.

## 41. Future Enhancements
* Shimmer effect instead of pulse (CSS linear-gradient translation).

## 42. CTO Notes
* Ensure we don't over-engineer this. Rough approximations of the data shape are fine; it doesn't need to be pixel-perfect.
