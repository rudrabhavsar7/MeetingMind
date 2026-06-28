---
Title: MeetingMind — Component: Button Group
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/button.md
---

# MeetingMind Component: Button Group

## 1. Overview
The Button Group component visually and semantically binds multiple related `<Button>` components together into a single cohesive unit, typically used for segmented controls or related actions.

## 2. Design Philosophy
Grouping related actions reduces visual clutter and clarifies to the user that these actions affect the same context or represent mutually exclusive choices (in the case of a segmented control).

## 3. Problem Statement
Standalone buttons placed next to each other can feel disjointed. When actions are tightly coupled (e.g., View as Grid vs. View as List), they need a unified container.

## 4. UX Goals
* Indicate a relationship between multiple actions.
* Save horizontal space by removing gaps and sharing borders.

## 5. Usage Guidelines
* Use for toggle states (e.g., Time ranges: "1D", "1W", "1M").
* Use for grouped actions (e.g., "Reply", "Forward", "Archive").

## 6. When to Use
* When 2 to 5 actions are deeply related to a single object or view state.

## 7. When NOT to Use
* For disparate actions (e.g., "Save" and "Delete" should not be a button group).
* If there are more than 5 options (use a Select dropdown instead).

## 8. Component Anatomy
* Container (Flexbox, rounded outer corners).
* Children (Buttons with squared inner corners, separated by border lines).

## 9. Variants
1. **Action Group:** Standard buttons bound together.
2. **Segmented Control:** Acts like radio buttons; one is always "active" (primary color), the others are inactive (muted).

## 10. Sizes
* Inherits size from the child buttons. All children MUST be the same size.

## 11. States
* Child states (Hover, Active, Disabled) operate independently.
* Container itself has no interactive states.

## 12. Layout Rules
* Horizontal by default. Can stack vertically on very narrow mobile screens, but horizontal is preferred.

## 13. Content Guidelines
* Text labels must be very short (1-2 words max) to prevent the group from becoming too wide.

## 14. Icon Rules
* Icon-only button groups are highly recommended for view toggles (e.g., Grid icon | List icon).

## 15. Color System
* Inner borders use `--border` or `--input`.
* Active segments use `--primary`.

## 16. Typography
* Inherited from Button.

## 17. Spacing
* Gap between children is strictly `0`.
* Outer border radius is `rounded-md`, inner radii are `rounded-none`.

## 18. Motion
* No group-level motion. Inherits button motion.

## 19. Accessibility
* If acting as a segmented control, it must implement the ARIA `radiogroup` role, and children must be `radio` roles.

## 20. Keyboard Interaction
* Standard Tab flow for Action Groups.
* Arrow key navigation (Left/Right) for Segmented Controls.

## 21. Responsive Behavior
* May wrap or convert to a native `<select>` element on extremely small viewports if space is constrained.

## 22. Dark Mode
* Borders adjust via CSS variables.

## 23. Design Tokens
* `--border`, `--radius`.

## 24. API Specification
```tsx
<ButtonGroup>
  <Button>Option A</Button>
  <Button>Option B</Button>
</ButtonGroup>
```

## 25. Props Reference
* `orientation`: "horizontal" | "vertical".
* `className`: Standard override.

## 26. Events
* None at the group level.

## 27. Composition
* Accepts `Button` or `IconButton` components as children.

## 28. AI Usage Guidelines
* N/A

## 29. Error Handling
* N/A

## 30. Edge Cases
* Only one child: Should render as a standard button, not a group.

## 31. Performance
* Lightweight structural wrapper.

## 32. Security Considerations
* N/A

## 33. Analytics Events
* N/A

## 34. Storybook Stories
* Text Only, Icons Only, Mixed, Vertical.

## 35. Figma Mapping
* `Core/ButtonGroup`

## 36. shadcn/ui Mapping
* Does not exist natively in shadcn/ui. Built custom using Tailwind flex utilities.

## 37. Tailwind Mapping
* `flex -space-x-px [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md`

## 38. Implementation Notes
* Use CSS selector magic (`first-child`, `last-child`) to handle the border radii seamlessly without needing to pass props to the child buttons.

## 39. QA Checklist
* Check focus ring on child buttons (ensure `z-10` is applied on focus so the ring isn't clipped by siblings).

## 40. Acceptance Criteria
* Visually appears as a single pill divided by lines.

## 41. Future Enhancements
* Radix UI Toggle Group integration for better a11y out of the box.

## 42. CTO Notes
* Ensure focus states look clean when tabbing through the group.
