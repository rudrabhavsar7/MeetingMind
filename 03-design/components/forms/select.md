---
Title: MeetingMind — Component: Select
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Select

## 1. Overview
A dropdown menu component allowing the user to choose one value from a predefined list of options.

## 2. Design Philosophy
Native browser `<select>` elements are notoriously difficult to style consistently. We use Radix UI's Select primitive to build a custom, fully accessible, stylable dropdown.

## 3. Problem Statement
Users need to pick from a constrained list of choices (e.g., Workspace Roles: Owner, Admin, Member, Viewer).

## 4. UX Goals
* Provide a clear list of mutually exclusive options.
* Match the visual styling of standard Inputs.

## 5. Usage Guidelines
* Use when there are 4 to 15 options.

## 6. When to Use
* Changing a user's role.
* Selecting a filter criteria.

## 7. When NOT to Use
* If there are fewer than 4 options (Use `RadioGroup` or `ButtonGroup`).
* If there are more than 15 options or options are dynamic (Use `Combobox` with search).
* For multi-select (Use `Combobox` or `Checkbox` list).

## 8. Component Anatomy
* **Trigger:** The button that opens the menu. Looks like an Input.
* **Value:** The currently selected text.
* **Icon:** A chevron pointing down.
* **Content/Portal:** The dropdown menu itself.
* **Item:** Individual choices.
* **ItemIndicator:** A checkmark showing the active choice.

## 9. Variants
* Default (Matches Input styling).

## 10. Sizes
* `h-10` to match Input.

## 11. States
* Trigger: Hover, Focus, Disabled, Open.
* Item: Hover/Highlighted, Selected.

## 12. Layout Rules
* The dropdown content uses a Portal, meaning it escapes its parent container to avoid `overflow: hidden` clipping issues.

## 13. Content Guidelines
* Options should be sorted logically (alphabetical, chronological, or by hierarchical importance).

## 14. Icon Rules
* Use `ChevronDown` for the trigger.
* Use `Check` for the selected item indicator.

## 15. Color System
* Trigger matches Input.
* Content background uses `--popover` and `--popover-foreground`.
* Hovered item uses `--accent`.

## 16. Typography
* `text-sm`.

## 17. Spacing
* Content padding `p-1`. Item padding `py-1.5 pl-8 pr-2`.

## 18. Motion
* Subtle fade-in and scale-in when the dropdown opens (handled by Radix CSS animations).

## 19. Accessibility
* Fully managed by Radix. Supports Typeahead (typing "A" jumps to "Admin").
* Handles ARIA roles (`listbox`, `option`).

## 20. Keyboard Interaction
* Space/Enter to open.
* Up/Down arrows to navigate.
* Enter to select.
* Esc to close.

## 21. Responsive Behavior
* The dropdown content automatically positions itself (flip, shift) to stay within the viewport.

## 22. Dark Mode
* Popover colors adjust via tokens.

## 23. Design Tokens
* `--input`, `--popover`, `--accent`.

## 24. API Specification
```tsx
<Select onValueChange={onChange} defaultValue={value}>
  <SelectTrigger>
    <SelectValue placeholder="Select a role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Admin</SelectItem>
    <SelectItem value="member">Member</SelectItem>
  </SelectContent>
</Select>
```

## 25. Props Reference
* Extends Radix UI Select props.

## 26. Events
* `onValueChange`, `onOpenChange`.

## 27. Composition
* Combines Trigger, Content, Group, Item components.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Validation state applied to the Trigger border.

## 30. Edge Cases
* Rendering inside modals (Radix handles portal layering via z-index).

## 31. Performance
* Renders options to the DOM only when open.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Disabled, Long List (Scrolling).

## 35. Figma Mapping
* `Core/Select`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add select`

## 37. Tailwind Mapping
* Trigger: Matches `Input`.
* Content: `bg-popover text-popover-foreground shadow-md animate-in fade-in-80`

## 38. Implementation Notes
* Due to the Portal, form submission events from inside the Select might not bubble up natively to an overarching `<form>` element in older React setups. React Hook Form manages this via `Controller`.

## 39. QA Checklist
* Test keyboard navigation and Typeahead.
* Ensure dropdown doesn't clip off the bottom of the screen.

## 40. Acceptance Criteria
* Accessible custom dropdown that matches form styling.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* Radix UI's Select is heavy. For very simple, hidden admin tools, native `<select>` is okay, but for the main user-facing app, strictly use this component.
