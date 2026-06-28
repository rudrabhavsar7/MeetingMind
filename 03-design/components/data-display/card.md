---
Title: MeetingMind — Component: Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Card

## 1. Overview
A flexible container that groups related information and actions into a single visual unit.

## 2. Design Philosophy
Cards break up the page into digestible chunks, establishing clear boundaries between distinct pieces of content.

## 3. Problem Statement
Running text and disparate buttons on a flat background lack visual hierarchy.

## 4. UX Goals
* Group related content.
* Elevate content slightly from the background surface.

## 5. Usage Guidelines
* Use for discrete entities (A Meeting, a Workspace, a Pricing Plan).
* Use to frame sections of a dashboard.

## 6. When to Use
* Dashboard widgets.
* Meeting List grid items.
* Login form container.

## 7. When NOT to Use
* Overusing nested cards creates "boxes within boxes," muddying the hierarchy. Try to keep cards at the top level of the layout.

## 8. Component Anatomy
* Container (Bordered, rounded box).
* Header (Title + Description).
* Content (The main body).
* Footer (Actions).

## 9. Variants
* **Default:** Bordered with subtle shadow.
* **Interactive:** Adds a hover state (`hover:shadow-md hover:border-primary/50 cursor-pointer`).

## 10. Sizes
* Fluid width/height.

## 11. States
* Hover (if interactive).

## 12. Layout Rules
* Header, Content, and Footer are vertical flex blocks.

## 13. Content Guidelines
* Keep card descriptions concise.

## 14. Icon Rules
* N/A.

## 15. Color System
* `bg-card text-card-foreground border`.

## 16. Typography
* Title: `text-xl font-semibold leading-none tracking-tight`.
* Description: `text-sm text-muted-foreground`.

## 17. Spacing
* Padding `p-6` around all sections.
* Padding `pt-0` on Content/Footer to tuck them tightly under the Header.

## 18. Motion
* Transform scale on hover (if interactive).

## 19. Accessibility
* If the entire card is clickable, wrap the contents in a button/link or use an `aria-labelledby` linking the card wrapper to its title.

## 20. Keyboard Interaction
* N/A (unless interactive).

## 21. Responsive Behavior
* Cards stack vertically on mobile and form grids on desktop.

## 22. Dark Mode
* The `--card` token handles background changes. Shadow intensity is reduced in dark mode (as shadows are harder to see against dark backgrounds).

## 23. Design Tokens
* `--card`, `--card-foreground`, `--border`.

## 24. API Specification
```tsx
<Card>
  <CardHeader>
    <CardTitle>Q3 Planning</CardTitle>
    <CardDescription>Oct 23, 2026</CardDescription>
  </CardHeader>
  <CardContent>
    <p>We discussed the upcoming roadmap...</p>
  </CardContent>
  <CardFooter>
    <Button>View details</Button>
  </CardFooter>
</Card>
```

## 25. Props Reference
* N/A (Composite HTML `div` wrappers).

## 26. Events
* N/A.

## 27. Composition
* Combines Header, Title, Description, Content, Footer.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Can wrap an ErrorState if only one card fails to load.

## 30. Edge Cases
* N/A.

## 31. Performance
* Zero cost.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Interactive, With Footer Actions.

## 35. Figma Mapping
* `DataDisplay/Card`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add card`

## 37. Tailwind Mapping
* `rounded-xl border bg-card text-card-foreground shadow`

## 38. Implementation Notes
* Be careful with `p-6` on mobile. Sometimes `p-4` is better for very small screens. Consider `p-4 md:p-6`.

## 39. QA Checklist
* Check contrast of card background vs page background in both light and dark modes.

## 40. Acceptance Criteria
* Clearly groups content visually.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
