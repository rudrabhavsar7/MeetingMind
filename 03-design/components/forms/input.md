---
Title: MeetingMind — Component: Input
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind Component: Input

## 1. Overview
The basic text input field used for gathering short-form data (emails, names, passwords).

## 2. Design Philosophy
Forms are the primary way users mutate data. Inputs must have highly visible focus states and clear validation feedback to prevent user frustration.

## 3. Problem Statement
Default browser inputs look inconsistent across OSs and often lack sufficient focus rings for accessibility.

## 4. UX Goals
* Provide clear affordance for text entry.
* Surface validation errors immediately adjacent to the field.

## 5. Usage Guidelines
* Always pair with a `<Label>`.
* Use placeholder text for examples, not as a replacement for labels.

## 6. When to Use
* Short, single-line text data.

## 7. When NOT to Use
* For multi-line text (use `Textarea`).
* For constrained choices (use `Select`).

## 8. Component Anatomy
* Container (Bordered box).
* Text (User input).
* Optional Leading/Trailing Icons (e.g., Search icon, Eye icon for password toggle).

## 9. Variants
1. **Default:** Standard border.
2. **Error:** Red border (`border-destructive`).

## 10. Sizes
* `h-10` is the default standard, aligning perfectly with default buttons.

## 11. States
* Default
* Hover (Slightly darker border)
* Focus (`ring-2 ring-ring`)
* Disabled (`opacity-50 bg-muted cursor-not-allowed`)
* Error

## 12. Layout Rules
* Usually `w-full` within a form group.

## 13. Content Guidelines
* N/A.

## 14. Icon Rules
* Leading icons (like `Search`) should be `text-muted-foreground` and `w-4 h-4`.

## 15. Color System
* Background: `bg-background`.
* Border: `border-input`.

## 16. Typography
* `text-sm`.

## 17. Spacing
* `px-3 py-2`.

## 18. Motion
* `transition-colors` on border focus.

## 19. Accessibility
* Must be linked to its label via `id` and `htmlFor`.
* If in an error state, must have `aria-invalid="true"`.

## 20. Keyboard Interaction
* Standard native input behavior.

## 21. Responsive Behavior
* `text-base` is highly recommended on iOS devices to prevent the browser from auto-zooming when the input is focused. Tailwind's `text-sm` is 14px, which triggers zoom on iPhone. (Use `text-base md:text-sm`).

## 22. Dark Mode
* Borders adjust via tokens.

## 23. Design Tokens
* `--input`, `--ring`.

## 24. API Specification
Standard React `input` props wrapped via `React.forwardRef`.

## 25. Props Reference
* Extends `React.InputHTMLAttributes<HTMLInputElement>`.

## 26. Events
* `onChange`, `onFocus`, `onBlur`.

## 27. Composition
* Used within `FormItem`, `FormControl`, `FormMessage`.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* The `error` state is typically managed by React Hook Form passing down an invalid state.

## 30. Edge Cases
* Autocomplete styles (yellow background in Chrome) must be overridden or accounted for in CSS.

## 31. Performance
* Very cheap. Ensure controlled inputs don't cause excessive re-renders of massive parent trees (use React Hook Form's isolated re-renders).

## 32. Security Considerations
* Type="password" must be used for secrets.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Disabled, Error, With Leading Icon, File Type.

## 35. Figma Mapping
* `Core/Input`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add input`

## 37. Tailwind Mapping
* `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

## 38. Implementation Notes
* The file input styling is included in the base Tailwind class via the `file:` modifier.

## 39. QA Checklist
* Check focus ring visibility.
* Verify iOS auto-zoom behavior on mobile Safari.

## 40. Acceptance Criteria
* Visually matches the design system and is fully accessible.

## 41. Future Enhancements
* Built-in password strength meter integration.

## 42. CTO Notes
* Standardize on React Hook Form to avoid boilerplate state management across the app.
