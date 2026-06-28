---
Title: MeetingMind — Template: Component Documentation
Version: 1.0.0
Status: Approved
Owner: Template Maintainer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: [Component Name]

## 1. Overview
[A 1-2 sentence description of what the component is and its primary purpose.]

## 2. Design Philosophy
[Why was this component built? What design problem does it solve?]

## 3. Problem Statement
[Describe the specific user pain point this component addresses.]

## 4. UX Goals
* [Goal 1]
* [Goal 2]

## 5. Usage Guidelines
* [Where should this be used?]
* [How should it be placed within layouts?]

## 6. When to Use
* [Scenario A]
* [Scenario B]

## 7. When NOT to Use
* [Scenario C] -> Use [Alternative Component] instead.

## 8. Component Anatomy
* [Part 1 - e.g., Container]
* [Part 2 - e.g., Icon]
* [Part 3 - e.g., Label]

## 9. Variants
* [Variant A - e.g., Primary]
* [Variant B - e.g., Destructive]

## 10. Sizes
* `sm`, `default`, `lg`

## 11. States
* Default
* Hover
* Focus
* Disabled
* Loading

## 12. Layout Rules
[How does it interact with sibling elements?]

## 13. Content Guidelines
[Rules for text length, phrasing, or formatting inside the component.]

## 14. Icon Rules
[Which lucide-react icons are appropriate here?]

## 15. Color System
[Primary brand colors used, semantic meaning of colors.]

## 16. Typography
[Font weights and sizes.]

## 17. Spacing
[Padding, margin, gaps.]

## 18. Motion
[Transitions, animations, easing functions.]

## 19. Accessibility
[ARIA roles, tabindex, screen reader considerations.]

## 20. Keyboard Interaction
[Which keys trigger actions?]

## 21. Responsive Behavior
[How does it change on mobile vs desktop?]

## 22. Dark Mode
[Specific dark mode considerations or overrides.]

## 23. Design Tokens
[Tailwind config variables utilized.]

## 24. API Specification
```tsx
import { ComponentName } from "@/components/ui/component-name"

export function Example() {
  return (
    <ComponentName variant="primary" size="lg">
      Click Me
    </ComponentName>
  )
}
```

## 25. Props Reference
* `variant`: `"primary" | "secondary"`
* `size`: `"sm" | "default" | "lg"`
* `className`: `string` (merged via `cn()`)

## 26. Events
* `onClick`: `(e: React.MouseEvent) => void`

## 27. Composition
[What other sub-components does it use? e.g., Uses Radix Popover primitive]

## 28. AI Usage Guidelines
[Does this component interact with AI data or states?]

## 29. Error Handling
[How does it display errors?]

## 30. Edge Cases
[What happens if text is too long? What if data is missing?]

## 31. Performance
[Memoization, rendering bottlenecks.]

## 32. Security Considerations
[XSS prevention if rendering user text.]

## 33. Analytics Events
[What PostHog events should be tracked when interacted with?]

## 34. Storybook Stories
[List of stories that must be created.]

## 35. Figma Mapping
[Link to or name of the corresponding Figma component.]

## 36. shadcn/ui Mapping
[Does this extend a base shadcn component?]

## 37. Tailwind Mapping
[Key tailwind classes that define its core look.]

## 38. Implementation Notes
[Any weird hacks or workarounds used.]

## 39. QA Checklist
* Check focus ring.
* Check dark mode contrast.

## 40. Acceptance Criteria
[What defines this component as 'Done'?]

## 41. Future Enhancements
[Planned features for v2.]

## 42. CTO Notes
[High-level architectural notes.]
