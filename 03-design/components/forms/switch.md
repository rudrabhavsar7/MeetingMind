---
Title: MeetingMind — Component: Switch
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Switch

## 1. Overview
A toggle switch mimicking physical hardware switches to control boolean states.

## 2. Design Philosophy
Provides an immediate, satisfying tactile feel for turning things on or off.

## 3. Problem Statement
Checkboxes inside settings panels feel like they require a "Save" button to apply. Switches imply immediate action.

## 4. UX Goals
* Convey instant state mutation.

## 5. Usage Guidelines
* Use for turning features on/off in Settings.

## 6. When to Use
* Instant-apply boolean settings (e.g., "Enable Email Notifications").

## 7. When NOT to Use
* In forms that require a "Submit" button to save. (Use `Checkbox` instead).

## 8. Component Anatomy
* Track (The background pill).
* Thumb (The circle that moves).

## 9. Variants
* Default.

## 10. Sizes
* `w-11 h-6` (Standard iOS-like size).

## 11. States
* Unchecked (Muted background).
* Checked (Primary background).
* Disabled.

## 12. Layout Rules
* Inline flex.

## 13. Content Guidelines
* Pair with a label on the left or right.

## 14. Icon Rules
* Rarely, the thumb can contain a tiny icon (e.g., Sun/Moon for theme toggle).

## 15. Color System
* Track: `--input` (off) / `--primary` (on).
* Thumb: `--background`.

## 16. Typography
* N/A.

## 17. Spacing
* Fully rounded.

## 18. Motion
* `transition-transform` on the thumb sliding X axis.

## 19. Accessibility
* Uses `role="switch"` and `aria-checked`.

## 20. Keyboard Interaction
* Space or Enter to toggle.

## 21. Responsive Behavior
* Fixed size.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<Switch id="airplane-mode" />
```

## 25. Props Reference
* Radix UI Switch props.

## 26. Events
* `onCheckedChange`.

## 27. Composition
* N/A.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* CSS Transform hardware acceleration.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Disabled.

## 35. Figma Mapping
* `Core/Switch`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add switch`

## 37. Tailwind Mapping
* `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* VoiceOver reads as "switch".

## 40. Acceptance Criteria
* Animates smoothly.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
