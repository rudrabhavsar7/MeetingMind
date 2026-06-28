---
Title: MeetingMind — Component: Textarea
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/forms/input.md
---

# MeetingMind Component: Textarea

## 1. Overview
A multi-line text input field used for gathering long-form data, such as manual meeting notes or complex AI prompts.

## 2. Design Philosophy
Matches the exact aesthetic of the standard `Input` component, but allows vertical expansion.

## 3. Problem Statement
Standard inputs clip text horizontally when users paste long strings, obscuring context.

## 4. UX Goals
* Provide sufficient space for long-form content.
* Allow user-controlled resizing where appropriate.

## 5. Usage Guidelines
* Use for description fields.
* Use for the main input in the AI Search interface (if allowing multi-line prompts).

## 6. When to Use
* When expected input exceeds 50 characters or requires line breaks.

## 7. When NOT to Use
* For emails, names, or passwords.

## 8. Component Anatomy
* Container (Bordered box).
* Text area.
* Optional resize handle (native browser feature).

## 9. Variants
* Default
* Error

## 10. Sizes
* `min-h-[80px]` by default.

## 11. States
* Hover, Focus, Disabled, Error (matches Input).

## 12. Layout Rules
* Usually `w-full`.

## 13. Content Guidelines
* N/A.

## 14. Icon Rules
* N/A.

## 15. Color System
* Matches Input.

## 16. Typography
* `text-sm`.

## 17. Spacing
* `px-3 py-2`.

## 18. Motion
* `transition-colors` on focus.

## 19. Accessibility
* Must be linked to a `<Label>`.

## 20. Keyboard Interaction
* `Enter` creates a new line (unlike `Input` which usually submits a form).
* `Shift+Enter` or `Cmd+Enter` can be wired to submit depending on context (e.g., in a chat UI).

## 21. Responsive Behavior
* Similar iOS zoom constraints as Input.

## 22. Dark Mode
* Borders adjust via tokens.

## 23. Design Tokens
* `--input`, `--ring`.

## 24. API Specification
Standard React `textarea` props wrapped via `React.forwardRef`.

## 25. Props Reference
* Extends `React.TextareaHTMLAttributes<HTMLTextAreaElement>`.

## 26. Events
* `onChange`.

## 27. Composition
* Used within `FormItem`.

## 28. AI Usage Guidelines
* If used for an AI prompt, consider adding an auto-resize script (like `react-textarea-autosize`) so the box grows with the user's prompt without needing manual dragging.

## 29. Error Handling
* Same as Input.

## 30. Edge Cases
* N/A.

## 31. Performance
* Very cheap.

## 32. Security Considerations
* Sanitize long-form input on the backend to prevent XSS if the content will be rendered back to the UI.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Disabled, With Label.

## 35. Figma Mapping
* `Core/Textarea`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add textarea`

## 37. Tailwind Mapping
* `flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

## 38. Implementation Notes
* Consider restricting `resize-y` to prevent horizontal breaking of grid layouts.

## 39. QA Checklist
* Ensure manual resizing doesn't break parent container flex/grid rules.

## 40. Acceptance Criteria
* Visually matches Input, supports multi-line text.

## 41. Future Enhancements
* Auto-expanding height based on content.

## 42. CTO Notes
* Standardize on this instead of raw `<textarea>`.
