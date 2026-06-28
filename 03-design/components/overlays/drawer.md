---
Title: MeetingMind — Component: Drawer
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/overlays/dialog.md
---

# MeetingMind Component: Drawer

## 1. Overview
A slide-out panel, usually originating from the bottom of the screen, designed specifically for touch interactions on mobile devices.

## 2. Design Philosophy
Dialogs (centered modals) feel clunky and hard to reach on mobile phones. Drawers provide a native, bottom-anchored experience.

## 3. Problem Statement
Mobile users struggle to reach the top-right "X" button on centered modals.

## 4. UX Goals
* Provide a mobile-optimized alternative to Dialogs.
* Allow swipe-to-dismiss gestures.

## 5. Usage Guidelines
* Use exclusively for mobile viewports, conditionally swapping out a `<Dialog>` for a `<Drawer>` based on screen size (using `useMediaQuery`).

## 6. When to Use
* Mobile forms.
* Mobile filters.

## 7. When NOT to Use
* On desktop (use `Dialog` or `Sheet` instead).

## 8. Component Anatomy
* Overlay.
* Content (Anchored bottom).
* Handle (Small visual pill at the top indicating it can be dragged).

## 9. Variants
* Default (Bottom anchor).

## 10. Sizes
* Width `100vw`. Height fluid based on content, up to `calc(100vh - 100px)`.

## 11. States
* Open/Closed.
* Dragging.

## 12. Layout Rules
* Fixed to the bottom.

## 13. Content Guidelines
* Same as Dialog.

## 14. Icon Rules
* Optional 'X' to close, though the swipe gesture is the primary dismiss method.

## 15. Color System
* Same as Dialog.

## 16. Typography
* Same as Dialog.

## 17. Spacing
* Padding `p-4` or `p-6`.

## 18. Motion
* Fluid spring physics (provided by `vaul` library).

## 19. Accessibility
* Same ARIA requirements as Dialog.

## 20. Keyboard Interaction
* Esc to close.

## 21. Responsive Behavior
* Used conditionally on `< md` screens.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--background`.

## 24. API Specification
```tsx
import { Drawer } from "@/components/ui/drawer"
// Same API surface as Dialog
```

## 25. Props Reference
* Uses `vaul` props.

## 26. Events
* `onOpenChange`.

## 27. Composition
* Combines Drawer, Overlay, Content.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Deeply nested scrollable areas inside the drawer can conflict with the swipe-to-dismiss gesture.

## 31. Performance
* `vaul` handles hardware-accelerated transforms.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Overlays/Drawer`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add drawer`

## 37. Tailwind Mapping
* `fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background`

## 38. Implementation Notes
* Shadcn wraps the excellent `vaul` library for this.

## 39. QA Checklist
* Test swipe-down-to-close on a physical mobile device.

## 40. Acceptance Criteria
* Smooth mobile physics.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
