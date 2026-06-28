---
Title: MeetingMind — Component: Sheet
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/overlays/dialog.md
---

# MeetingMind Component: Sheet

## 1. Overview
A slide-out panel anchored to the edge of the screen, typically used for complex supplementary content that shouldn't obscure the main view completely.

## 2. Design Philosophy
Unlike centered Dialogs, Sheets (especially side-sheets) allow the user to maintain some visual context of the underlying page.

## 3. Problem Statement
Showing a complex form or a deep list of notifications in a centered box feels cramped.

## 4. UX Goals
* Maximize vertical space.

## 5. Usage Guidelines
* Use for Mobile Sidebar Navigation (Left anchor).
* Use for deep filter panels (Right anchor).

## 6. When to Use
* Hamburger menus.

## 7. When NOT to Use
* For quick confirmations (Use `AlertDialog`).

## 8. Component Anatomy
* Overlay.
* Content (Anchored to an edge).

## 9. Variants
* `left`, `right`, `top`, `bottom`. (Right is default).

## 10. Sizes
* `w-3/4 sm:max-w-sm` (Standard side panel).

## 11. States
* Open/Closed.

## 12. Layout Rules
* Fixed to an edge. Height `100vh` (for left/right).

## 13. Content Guidelines
* Same as Dialog.

## 14. Icon Rules
* Use an `X` in the top corner.

## 15. Color System
* `bg-background`.

## 16. Typography
* Same as Dialog.

## 17. Spacing
* `p-6`.

## 18. Motion
* Slide-in animation from the anchored edge.

## 19. Accessibility
* It is essentially a Radix Dialog under the hood, with different CSS. Same ARIA rules apply.

## 20. Keyboard Interaction
* Esc to close.

## 21. Responsive Behavior
* Shrinks to fit mobile width.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--background`.

## 24. API Specification
```tsx
<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
    </SheetHeader>
  </SheetContent>
</Sheet>
```

## 25. Props Reference
* `side`: "top" | "bottom" | "left" | "right".

## 26. Events
* `onOpenChange`.

## 27. Composition
* Combines Dialog primitives.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* All 4 edge variants.

## 35. Figma Mapping
* `Overlays/Sheet`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add sheet`

## 37. Tailwind Mapping
* `data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-right-1/2`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Ensure the mobile sidebar fits all menu items.

## 40. Acceptance Criteria
* Animates smoothly from edges.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
