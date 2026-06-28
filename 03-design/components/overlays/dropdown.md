---
Title: MeetingMind — Component: Dropdown Menu
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Dropdown Menu

## 1. Overview
A list of actions or links triggered by a button, presented in a floating panel.

## 2. Design Philosophy
Condenses secondary actions into a single menu, preventing toolbar clutter.

## 3. Problem Statement
A Meeting Card has actions: Edit, Share, Export, Delete. Showing all four buttons clutters the UI.

## 4. UX Goals
* Hide secondary actions logically.
* Support nested sub-menus.

## 5. Usage Guidelines
* Use an `Ellipsis` or `MoreHorizontal` icon for the trigger.

## 6. When to Use
* Row actions in a data table.
* User profile menu (Top right).
* Export menus.

## 7. When NOT to Use
* For form selections (Use `Select`).
* For primary actions (e.g., "Save").

## 8. Component Anatomy
* Trigger.
* Content (The panel).
* Item (Action or link).
* Separator (Divider line).
* Label (Group heading).
* Sub-trigger / Sub-content (Nested menus).

## 9. Variants
* Action Menu.
* User Profile Menu.

## 10. Sizes
* Fluid width (`min-w-[8rem]`).

## 11. States
* Item: Hover, Disabled.

## 12. Layout Rules
* Positions via Floating UI.

## 13. Content Guidelines
* Use concise verbs (e.g., "Delete meeting" -> "Delete").

## 14. Icon Rules
* Use leading icons for items if it adds clarity.
* Destructive actions (Delete) can use `--destructive` red text/icons.

## 15. Color System
* `bg-popover text-popover-foreground`.
* Hover item: `bg-accent text-accent-foreground`.

## 16. Typography
* `text-sm`.

## 17. Spacing
* Content padding `p-1`. Item padding `px-2 py-1.5`.

## 18. Motion
* Radix CSS animations (fade/zoom).

## 19. Accessibility
* Managed by Radix UI. Uses `role="menu"` and `role="menuitem"`.

## 20. Keyboard Interaction
* Enter to open. Arrow keys up/down to navigate items. Enter to select. Esc to close.

## 21. Responsive Behavior
* On mobile, standard dropdowns can be tricky. Shadcn/ui renders them natively, but occasionally converting them to a bottom `Drawer` on mobile is preferred.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`, `--accent`.

## 24. API Specification
```tsx
<DropdownMenu>
  <DropdownMenuTrigger><MoreHorizontal /></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Share</DropdownMenuItem>
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 25. Props Reference
* Radix props.

## 26. Events
* `onSelect` on items.

## 27. Composition
* Combines many sub-components.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Nested menus that open off-screen (Radix handles collision detection).

## 31. Performance
* Renders content only when open.

## 32. Security Considerations
* Hide or disable items based on RBAC permissions (e.g., don't show "Delete" to a Viewer).

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, With Submenu, Checkbox Items.

## 35. Figma Mapping
* `Overlays/DropdownMenu`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add dropdown-menu`

## 37. Tailwind Mapping
* Standard popover classes.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Test keyboard arrow navigation.

## 40. Acceptance Criteria
* Accessible action list.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
