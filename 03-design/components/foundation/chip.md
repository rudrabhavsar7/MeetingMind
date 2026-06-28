---
Title: MeetingMind — Component: Chip
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/badge.md
---

# MeetingMind Component: Chip

## 1. Overview
A Chip (or Tag) is an interactive element representing an attribute, filter, or selection. Unlike a Badge (which is read-only), a Chip can be clicked, toggled, or dismissed.

## 2. Design Philosophy
Chips allow users to manipulate complex data sets (like filtering meetings) in a tactile, visually compact way.

## 3. Problem Statement
Checkboxes and multi-select dropdowns take up too much vertical space or hide active selections. Users need to see exactly what filters are currently applied to a list.

## 4. UX Goals
* Clearly show active state.
* Provide an easy way to remove the selection (dismiss icon).

## 5. Usage Guidelines
* Use for active filters (e.g., above the Meeting List).
* Use for selected options in a multi-select dropdown.
* Use for participant tags ("Maya", "Alex").

## 6. When to Use
* When the user needs to add, remove, or toggle a specific attribute.

## 7. When NOT to Use
* For read-only status (use a Badge).
* For primary actions (use a Button).

## 8. Component Anatomy
* Container (Rounded).
* Label.
* Optional Leading Icon (e.g., an Avatar for a person).
* Optional Trailing Icon (usually an 'X' to dismiss).

## 9. Variants
1. **Filter Chip:** Toggles on/off.
2. **Dismissible Chip:** Has an 'X' to remove it entirely.
3. **Choice Chip:** Acts like a radio button group (mutually exclusive).

## 10. Sizes
* Usually slightly taller than a Badge to accommodate a comfortable touch target (min `h-8`).

## 11. States
* Default
* Hover
* Active (Selected)
* Focus

## 12. Layout Rules
* Display `inline-flex`.
* Usually placed inside a flex container with `flex-wrap gap-2` to allow them to flow like text.

## 13. Content Guidelines
* Short, descriptive text.

## 14. Icon Rules
* The dismiss 'X' (Lucide `X` or `XCircle`) is standard on the right side.

## 15. Color System
* Unselected: `bg-muted text-muted-foreground`.
* Selected: `bg-primary/20 text-primary-foreground` or similar high-contrast state.

## 16. Typography
* `text-sm font-medium`.

## 17. Spacing
* `px-3 py-1 rounded-full`.

## 18. Motion
* Subtle color transition on hover/select.

## 19. Accessibility
* Must be focusable (`tabindex="0"` or using a `<button>` tag).
* Must communicate state (e.g., `aria-pressed="true"` for toggle chips).
* Dismiss button must have `aria-label="Remove [Item]"`.

## 20. Keyboard Interaction
* Enter/Space to toggle.
* Backspace/Delete to remove (if focus is on the chip).

## 21. Responsive Behavior
* Wraps to next line in tight containers.

## 22. Dark Mode
* Ensure border contrast is visible.

## 23. Design Tokens
* `--muted`, `--primary`.

## 24. API Specification
```tsx
<Chip 
  label="Marketing" 
  onDismiss={() => removeTag('Marketing')} 
  isSelected={true} 
/>
```

## 25. Props Reference
* `label`: String.
* `isSelected`: Boolean.
* `onDismiss`: Function (optional).
* `onClick`: Function (optional).

## 26. Events
* `onClick`, `onDismiss`.

## 27. Composition
* Used heavily inside the `Combobox` component for multi-select.

## 28. AI Usage Guidelines
* AI-suggested topics can be rendered as chips with a subtle sparkle icon, allowing the user to click them to apply as filters.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Extremely long labels should truncate, but a tooltip should reveal the full text.

## 31. Performance
* Lightweight.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track filter toggles to understand search behavior.

## 34. Storybook Stories
* Default, Selected, With Dismiss, With Avatar.

## 35. Figma Mapping
* `Core/Chip`

## 36. shadcn/ui Mapping
* No direct equivalent. Often built by combining `Badge` styles with `<button>` logic.

## 37. Tailwind Mapping
* `inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium cursor-pointer transition-colors hover:bg-muted`

## 38. Implementation Notes
* Ensure the click target for the dismiss 'X' doesn't accidentally trigger the chip's main `onClick` toggle (use `e.stopPropagation()`).

## 39. QA Checklist
* Test removing a chip via keyboard.

## 40. Acceptance Criteria
* Interactive, supports dismissing, wraps nicely.

## 41. Future Enhancements
* Drag and drop sorting of chips.

## 42. CTO Notes
* A Chip is just a Button in disguise. Make sure it behaves like one for screen readers.
