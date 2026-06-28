---
Title: MeetingMind — Component: Icon Button
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/button.md, 03-design/icons.md
---

# MeetingMind Component: Icon Button

## 1. Overview
A specialized variant of the standard Button component that contains only a single icon and no visible text.

## 2. Design Philosophy
Icon Buttons conserve valuable screen real estate in dense interfaces (like data tables or toolbars) while providing necessary actions.

## 3. Problem Statement
Text-heavy buttons in a repeating list (like a row of action items) cause visual noise. 

## 4. UX Goals
* Provide actions in a compact footprint.
* Maintain clear meaning without text.

## 5. Usage Guidelines
* Only use universally understood icons (Trash for delete, Pencil for edit).
* MUST be paired with a Tooltip if the meaning is even slightly ambiguous.

## 6. When to Use
* Table row actions (Edit, Delete).
* Header toolbars (Settings, Notifications).
* Media player controls (Play, Pause).

## 7. When NOT to Use
* For primary page actions (e.g., "Submit Form"). Primary actions must always have text.

## 8. Component Anatomy
* Container (Square or Circular).
* Centered Icon (Lucide React).
* (Hidden) Accessible label.

## 9. Variants
* Matches Button variants (Ghost, Outline, Secondary are most common. Primary and Destructive are rarely used for icon-only).

## 10. Sizes
* `sm`: 32x32px (Icon 16px)
* `default`: 40x40px (Icon 16px or 20px)
* `lg`: 48x48px (Icon 24px)

## 11. States
* Standard button states (Hover, Focus, Disabled).

## 12. Layout Rules
* Must maintain a 1:1 aspect ratio.

## 13. Content Guidelines
* No visible text allowed.

## 14. Icon Rules
* Icons must be perfectly centered visually and mathematically.

## 15. Color System
* Inherits from Button variants.

## 16. Typography
* N/A.

## 17. Spacing
* Padding is identical on all four sides (`p-2` or `p-3`).

## 18. Motion
* Same tap scale as standard Button.

## 19. Accessibility
* **CRITICAL:** Must include an `aria-label` or a visually hidden `<span className="sr-only">Label</span>` describing the action.

## 20. Keyboard Interaction
* Identical to standard Button.

## 21. Responsive Behavior
* Touch targets must remain at least 44x44px on mobile, even if the visual button is smaller. (Use padding on a wrapper or increase the size variant on mobile).

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* Inherited.

## 24. API Specification
Usually just a standard `<Button size="icon">` wrapper.

## 25. Props Reference
* Same as Button, plus a required `aria-label` prop.

## 26. Events
* `onClick`.

## 27. Composition
* Frequently wrapped in a Radix UI `<Tooltip>`.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Very lightweight.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Variants, Sizes, Tooltip integration.

## 35. Figma Mapping
* `Core/Button` (Icon only variant).

## 36. shadcn/ui Mapping
* Uses `<Button size="icon">`.

## 37. Tailwind Mapping
* `h-10 w-10 shrink-0 flex items-center justify-center`.

## 38. Implementation Notes
* Enforce the `aria-label` via a custom ESLint rule or TypeScript wrapper if possible.

## 39. QA Checklist
* VoiceOver/NVDA reads the button correctly.

## 40. Acceptance Criteria
* Perfect 1:1 square. Icon centered. Accessible.

## 41. Future Enhancements
* Circular variants (`rounded-full`) for floating action buttons (FABs).

## 42. CTO Notes
* Accessibility is the biggest failure point here. Do not merge PRs with empty `aria-label`s on icon buttons.
