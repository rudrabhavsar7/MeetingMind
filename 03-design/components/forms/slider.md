---
Title: MeetingMind — Component: Slider
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Slider

## 1. Overview
An input where the user selects a value from within a given range.

## 2. Design Philosophy
Tactile control for analog values.

## 3. Problem Statement
Number inputs are clunky for abstract ranges (like Volume or Playback Speed).

## 4. UX Goals
* Smooth drag interaction.

## 5. Usage Guidelines
* Use for continuous or stepped ranges.

## 6. When to Use
* Audio playback speed (0.5x to 2x).
* Volume control.

## 7. When NOT to Use
* For precise, unbounded numbers (like monetary amounts).

## 8. Component Anatomy
* Track (Background).
* Range (Filled portion).
* Thumb (The draggable handle).

## 9. Variants
* Default.

## 10. Sizes
* Track height `h-2`. Thumb `h-5 w-5`.

## 11. States
* Hover, Dragging, Disabled.

## 12. Layout Rules
* Usually `w-full` of container.

## 13. Content Guidelines
* Min/Max labels usually placed on ends.

## 14. Icon Rules
* N/A.

## 15. Color System
* `--primary` for Range/Thumb. `--secondary` for Track.

## 16. Typography
* N/A.

## 17. Spacing
* N/A.

## 18. Motion
* None (Position tracks mouse instantly).

## 19. Accessibility
* Uses `role="slider"`.

## 20. Keyboard Interaction
* Arrow keys to increment/decrement.

## 21. Responsive Behavior
* Fluid width.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<Slider defaultValue={[33]} max={100} step={1} />
```

## 25. Props Reference
* Radix UI Slider props.

## 26. Events
* `onValueChange`.

## 27. Composition
* N/A.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Multiple thumbs (range slider) supported natively by Radix.

## 31. Performance
* Touch events must be passive where possible to avoid jank.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Core/Slider`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add slider`

## 37. Tailwind Mapping
* `relative flex w-full touch-none select-none items-center`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Test touch drag on mobile.

## 40. Acceptance Criteria
* Smooth drag.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
