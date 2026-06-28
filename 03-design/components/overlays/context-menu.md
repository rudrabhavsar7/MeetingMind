---
Title: MeetingMind — Component: Context Menu
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/overlays/dropdown.md
---

# MeetingMind Component: Context Menu

## 1. Overview
A menu that appears upon right-clicking (or long-pressing) an element.

## 2. Design Philosophy
Provides a native OS-like feel for power users within a web application.

## 3. Problem Statement
Some interfaces (like a grid of files or a list of meetings) are so dense that adding a `...` button to every item clutters the UI.

## 4. UX Goals
* Provide invisible, discoverable power-user tools.

## 5. Usage Guidelines
* Never make the Context Menu the *only* way to access an action, as it is inherently hidden. Always provide a visible alternative (like a select checkbox + toolbar, or a `...` button on hover).

## 6. When to Use
* On Meeting Cards.
* On Transcript text (e.g., "Highlight this section").

## 7. When NOT to Use
* As the primary navigation.

## 8. Component Anatomy
* Trigger Zone (The area that listens for the right-click).
* Content (Identical to `DropdownMenu`).

## 9. Variants
* N/A.

## 10. Sizes
* N/A.

## 11. States
* Open/Closed.

## 12. Layout Rules
* Positions exactly at the cursor's (X, Y) coordinates.

## 13. Content Guidelines
* Same as DropdownMenu.

## 14. Icon Rules
* Same as DropdownMenu.

## 15. Color System
* Same as DropdownMenu.

## 16. Typography
* Same as DropdownMenu.

## 17. Spacing
* Same as DropdownMenu.

## 18. Motion
* Same as DropdownMenu.

## 19. Accessibility
* Highly complex, managed by Radix UI `ContextMenu`. Overrides the native browser context menu.

## 20. Keyboard Interaction
* Shift+F10 on Windows opens context menus. Radix handles this.

## 21. Responsive Behavior
* On touch devices, triggers via a long-press.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`.

## 24. API Specification
```tsx
<ContextMenu>
  <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Billing</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

## 25. Props Reference
* Radix Context Menu props.

## 26. Events
* N/A.

## 27. Composition
* Combines Trigger and Content.

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
* Default.

## 35. Figma Mapping
* `Overlays/ContextMenu`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add context-menu`

## 37. Tailwind Mapping
* Same as `DropdownMenu`.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Test long-press on mobile.

## 40. Acceptance Criteria
* Overrides browser default menu cleanly.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* Use sparingly. Overriding the browser context menu can frustrate users who just want to "Copy" text.
