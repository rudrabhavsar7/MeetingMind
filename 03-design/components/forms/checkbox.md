---
Title: MeetingMind — Component: Checkbox
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind Component: Checkbox

## 1. Overview
A UI control allowing a user to select one or more options from a set, or to toggle a single binary setting.

## 2. Design Philosophy
Checkboxes are standard, universally understood controls. We style them to match our brand (Emerald primary color, subtle borders) while retaining native-like behavior.

## 3. Problem Statement
Default HTML checkboxes scale poorly and are hard to style with custom brand colors across different browsers.

## 4. UX Goals
* Clear distinction between checked and unchecked states.
* Large enough touch target.

## 5. Usage Guidelines
* Use for boolean values (e.g., "I agree to the Terms").
* Use in lists where multiple selections are allowed.

## 6. When to Use
* Bulk actions in a data table (selecting rows).
* Action item completion toggles.

## 7. When NOT to Use
* When options are mutually exclusive (Use `RadioGroup`).
* For instant state changes that don't require a form submit (Use `Switch`). *Exception: Checking off a task usually uses a checkbox even if it instantly mutates.*

## 8. Component Anatomy
* Square box.
* Check icon (when checked).
* Paired Label (Crucial).

## 9. Variants
* Default (Unchecked).
* Checked.
* Indeterminate (Dash icon instead of check, used for "Select All" when only some rows are selected).

## 10. Sizes
* Box is strictly `h-4 w-4` (16x16px).

## 11. States
* Hover (Slight border darkening).
* Focus (`ring-2`).
* Disabled (`opacity-50`).

## 12. Layout Rules
* Display `inline-flex` with its accompanying label, separated by `gap-2` or `gap-3`.

## 13. Content Guidelines
* Label should be clickable to toggle the checkbox.

## 14. Icon Rules
* `Check` from Lucide React (scaled to fit).
* `Minus` for indeterminate state.

## 15. Color System
* Unchecked: `bg-transparent border-primary`.
* Checked: `bg-primary text-primary-foreground`.

## 16. Typography
* N/A.

## 17. Spacing
* Margin/gap between box and label is usually 8px.

## 18. Motion
* A very fast scale-in or fade-in of the check icon when toggled.

## 19. Accessibility
* Built on Radix UI Checkbox. Uses `button` with `role="checkbox"`.
* Spacebar toggles it.
* Must be wired to the `<Label>` via `id`.

## 20. Keyboard Interaction
* Focus with `Tab`, toggle with `Space`.

## 21. Responsive Behavior
* The bounding box of the flex container (checkbox + label) should have adequate padding on mobile for touch.

## 22. Dark Mode
* Border color adjusts.

## 23. Design Tokens
* `--primary`, `--border`, `--ring`.

## 24. API Specification
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <label htmlFor="terms">Accept terms</label>
</div>
```

## 25. Props Reference
* `checked`: Boolean | "indeterminate".
* `onCheckedChange`: Function.
* `disabled`: Boolean.

## 26. Events
* `onCheckedChange`.

## 27. Composition
* Used in Data Tables and Form Groups.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Can have a red border if validation fails (e.g., required TOS acceptance).

## 30. Edge Cases
* Indeterminate state in nested lists.

## 31. Performance
* Very cheap.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Unchecked, Checked, Indeterminate, Disabled, With Label.

## 35. Figma Mapping
* `Core/Checkbox`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add checkbox`

## 37. Tailwind Mapping
* `peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`

## 38. Implementation Notes
* Make sure `peer` classes are used if you want the label to change color when the checkbox is disabled.

## 39. QA Checklist
* Click the text label to ensure it toggles the checkbox.

## 40. Acceptance Criteria
* Clearly toggles, accessible via keyboard.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
