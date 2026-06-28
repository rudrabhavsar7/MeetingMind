---
Title: MeetingMind — Component: Breadcrumb
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Breadcrumb

## 1. Overview
A secondary navigation aid that shows the user's location in the app's hierarchy.

## 2. Design Philosophy
Provides context and an easy "way out" when navigating deep nested structures.

## 3. Problem Statement
When a user clicks a direct link to a Meeting Details page, they lack context of where they are in the app hierarchy.

## 4. UX Goals
* Show structural hierarchy clearly.
* Allow quick navigation up the tree.

## 5. Usage Guidelines
* Placed at the top of the main content area, below the topbar but above the page title.

## 6. When to Use
* Deep pages (e.g., `/settings/workspace/billing` or `/meetings/[id]`).

## 7. When NOT to Use
* On top-level dashboard pages.

## 8. Component Anatomy
* Container (List).
* Items (Links).
* Separators (Icons).
* Current Page (Text).

## 9. Variants
* Default.

## 10. Sizes
* Text size `text-sm`.

## 11. States
* Links have hover states.

## 12. Layout Rules
* Horizontal flex list.

## 13. Content Guidelines
* Truncate very long meeting titles in breadcrumbs.

## 14. Icon Rules
* Use `ChevronRight` or `Slash` as separators.

## 15. Color System
* Links: `text-muted-foreground hover:text-foreground`.
* Current Page: `text-foreground font-medium`.

## 16. Typography
* `text-sm`.

## 17. Spacing
* Small gap between items (`gap-1.5`).

## 18. Motion
* None.

## 19. Accessibility
* Wrap in `<nav aria-label="breadcrumb">`.
* Use `<ol>` and `<li>` elements.
* Separators must have `aria-hidden="true"`.

## 20. Keyboard Interaction
* Standard link tabbing.

## 21. Responsive Behavior
* On very small screens, collapse middle items into an ellipsis (`...`) dropdown.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--muted-foreground`.

## 24. API Specification
```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/meetings">Meetings</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Q3 Planning</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

## 25. Props Reference
* N/A (Composite component).

## 26. Events
* N/A.

## 27. Composition
* Combines Link, Separator, Page items.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Extremely long paths (Collapse middle nodes).

## 31. Performance
* Very cheap.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Collapsed.

## 35. Figma Mapping
* `Navigation/Breadcrumb`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add breadcrumb`

## 37. Tailwind Mapping
* `flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* VoiceOver should read it as a list.

## 40. Acceptance Criteria
* Clear visual hierarchy.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
