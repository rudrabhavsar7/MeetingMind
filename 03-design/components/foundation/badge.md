---
Title: MeetingMind — Component: Badge
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind Component: Badge

## 1. Overview
A small, read-only visual indicator used to highlight status, categories, or numerical counts.

## 2. Design Philosophy
Badges provide quick, scannable metadata without drawing too much attention away from the primary content.

## 3. Problem Statement
Text alone is not distinct enough to indicate status (e.g., "Pending" vs "Complete") when scanning a list of 50 meetings.

## 4. UX Goals
* Provide immediate visual classification.
* Avoid looking like a clickable button.

## 5. Usage Guidelines
* Use for statuses (Processed, Failed, Queued).
* Use for tags (Marketing, Engineering).
* Use for counts (3 new notifications).

## 6. When to Use
* To augment primary data with metadata.

## 7. When NOT to Use
* As a clickable filter (Use a `Chip` or `Toggle` instead).
* For primary text.

## 8. Component Anatomy
* Container (Pill-shaped, background color).
* Label (Small, bold text).

## 9. Variants
1. **Default:** Muted slate. For neutral tags.
2. **Success:** Emerald. For "Processed" or "Complete".
3. **Warning:** Amber. For "Processing" or "Needs Review".
4. **Destructive:** Rose. For "Failed" or errors.
5. **Outline:** Transparent with border.

## 10. Sizes
* `default`: Standard metadata.
* `sm`: Used inside small cards or inline with text.

## 11. States
* Read-only. No hover or active states.

## 12. Layout Rules
* Display `inline-flex`.

## 13. Content Guidelines
* Keep text extremely short (1-2 words).
* ALL CAPS or Title Case based on context.

## 14. Icon Rules
* Rare, but a very small leading icon (12px) can be used (e.g., a spinner for "Processing").

## 15. Color System
* Relies on specific semantic colors (Emerald, Amber, Rose).

## 16. Typography
* `text-xs font-semibold`.

## 17. Spacing
* Tight padding (`px-2.5 py-0.5`).
* Fully rounded corners (`rounded-full`).

## 18. Motion
* None.

## 19. Accessibility
* Ensure contrast ratio is sufficient (especially for Warning/Amber badges).

## 20. Keyboard Interaction
* N/A (Not interactive).

## 21. Responsive Behavior
* Shrinks to fit content.

## 22. Dark Mode
* Adjusts automatically. Often uses darker, semi-transparent backgrounds in dark mode to prevent glowing.

## 23. Design Tokens
* Semantic colors.

## 24. API Specification
```tsx
<Badge variant="success">Processed</Badge>
```

## 25. Props Reference
* `variant`: Enum.
* `className`: String.

## 26. Events
* None.

## 27. Composition
* Can be placed inside Headers or Cards.

## 28. AI Usage Guidelines
* Use a specific "AI Generated" badge variant (with a subtle sparkle or primary color) to denote content written by the LLM vs humans.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Very long text: Will force wrap or stretch the badge. Avoid long text.

## 31. Performance
* Pure CSS.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* All variants.

## 35. Figma Mapping
* `Core/Badge`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add badge`

## 37. Tailwind Mapping
* `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`

## 38. Implementation Notes
* Make sure `focus` classes are removed if the badge is truly read-only, as it shouldn't receive focus.

## 39. QA Checklist
* Check contrast on Warning (amber) variant in light mode.

## 40. Acceptance Criteria
* Visually distinct from buttons.

## 41. Future Enhancements
* Count badges (small circles for numbers > 99).

## 42. CTO Notes
* Keep these simple. Don't add click handlers to badges; if it needs to be clicked, it's a Button or a Link.
