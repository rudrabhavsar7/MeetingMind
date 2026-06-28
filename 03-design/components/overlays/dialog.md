---
Title: MeetingMind — Component: Dialog (Modal)
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Dialog (Modal)

## 1. Overview
A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.

## 2. Design Philosophy
Dialogs force user attention to a single task or piece of critical information by blocking all other interactions.

## 3. Problem Statement
Complex actions (like inviting 5 users to a workspace) clutter the main UI.

## 4. UX Goals
* Focus attention.
* Provide clear exit paths (Esc, Close button, clicking outside).

## 5. Usage Guidelines
* Use for critical workflows that interrupt the current task.

## 6. When to Use
* Inviting members.
* Detailed forms that don't warrant a full page route.

## 7. When NOT to Use
* For simple confirmations (Use `AlertDialog`).
* For long, complex, multi-step wizards (Use a dedicated page route).

## 8. Component Anatomy
* Overlay (Backdrop).
* Content (The white box).
* Header (Title and Description).
* Body (Forms, text).
* Footer (Action buttons).
* Close Icon (Top right).

## 9. Variants
* Default (Centered modal).

## 10. Sizes
* `sm` (`max-w-sm`).
* `default` (`max-w-md` or `max-w-lg`).
* `xl` (For complex data tables, rare).

## 11. States
* Open/Closed.

## 12. Layout Rules
* Centered horizontally and vertically using fixed positioning.

## 13. Content Guidelines
* Must have a descriptive Title.

## 14. Icon Rules
* Use an `X` icon in the top right for closing.

## 15. Color System
* Backdrop: `bg-background/80 backdrop-blur-sm`.
* Content: `bg-background`.

## 16. Typography
* Title: `text-lg font-semibold`.

## 17. Spacing
* Content padding `p-6`.

## 18. Motion
* `animate-in fade-in zoom-in-95` (Subtle scale up).

## 19. Accessibility
* Focus is trapped inside the dialog while open.
* Returns focus to the trigger element when closed.
* Requires `aria-describedby` if a description is present.

## 20. Keyboard Interaction
* Esc to close.
* Tab cycles through internal focusable elements.

## 21. Responsive Behavior
* On mobile screens, dialogs should often become full-screen or slide up as a `Sheet`/`Drawer`.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--background`.

## 24. API Specification
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## 25. Props Reference
* Radix UI Dialog props.

## 26. Events
* `onOpenChange`.

## 27. Composition
* Combines Overlay, Content, Header, Footer.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Form errors display inside the dialog body.

## 30. Edge Cases
* Nested dialogs (highly discouraged for UX reasons, but Radix supports it).

## 31. Performance
* Ensure heavy forms inside the dialog are lazy-loaded if they impact the initial bundle size.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Custom Sizes.

## 35. Figma Mapping
* `Overlays/Dialog`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add dialog`

## 37. Tailwind Mapping
* `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Verify focus trap works via keyboard.

## 40. Acceptance Criteria
* Accessible, responsive overlay.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
