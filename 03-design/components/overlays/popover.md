---
Title: MeetingMind — Component: Popover
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Popover

## 1. Overview
A floating panel tethered to a trigger element, displaying rich content or complex actions.

## 2. Design Philosophy
Popovers are non-modal dialogs. They provide contextual tools without stealing focus completely.

## 3. Problem Statement
Some actions (like picking a date) don't need a full-screen Dialog, but are too complex for a standard DropdownMenu.

## 4. UX Goals
* Keep context visible while providing tools.

## 5. Usage Guidelines
* Use for Date Pickers, Comboboxes, and rich contextual menus.

## 6. When to Use
* When a dropdown needs to contain form elements (inputs, calendars).

## 7. When NOT to Use
* For simple lists of action links (Use `DropdownMenu`).
* For simple text hints (Use `Tooltip`).

## 8. Component Anatomy
* Trigger.
* Floating Content Panel.
* Optional Arrow pointing to trigger.

## 9. Variants
* Default.

## 10. Sizes
* Dynamic based on content. Usually constrained `max-w-sm`.

## 11. States
* Open/Closed.

## 12. Layout Rules
* Uses positioning logic (Floating UI) to avoid clipping off-screen.

## 13. Content Guidelines
* Can contain any arbitrary React children.

## 14. Icon Rules
* N/A.

## 15. Color System
* `bg-popover text-popover-foreground`.

## 16. Typography
* N/A.

## 17. Spacing
* `p-4` internal padding.

## 18. Motion
* `zoom-in-95 fade-in-0`.

## 19. Accessibility
* Managed by Radix UI. Traps focus within the popover.

## 20. Keyboard Interaction
* Esc to close. Tabbing cycles inside.

## 21. Responsive Behavior
* Repositions itself if scrolling causes it to hit the edge of the viewport.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`.

## 24. API Specification
```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>Place content for the popover here.</PopoverContent>
</Popover>
```

## 25. Props Reference
* Radix Popover props (`side`, `align`, `sideOffset`).

## 26. Events
* `onOpenChange`.

## 27. Composition
* Used to build `Combobox` and `DatePicker`.

## 28. AI Usage Guidelines
* Use to show the full prompt configuration when tweaking AI summary settings.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Ensure z-index is higher than other page elements.

## 31. Performance
* Fast, rendered in a portal.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Overlays/Popover`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add popover`

## 37. Tailwind Mapping
* `z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none`

## 38. Implementation Notes
* The `PopoverContent` should usually have a specified width (e.g. `w-80`) rather than relying purely on child content width to prevent jittering.

## 39. QA Checklist
* Open popover and scroll the page to verify it stays tethered to the trigger.

## 40. Acceptance Criteria
* Properly tethered, accessible.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
