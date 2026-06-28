---
Title: MeetingMind — Component: Pagination
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Pagination

## 1. Overview
Navigation controls for moving between discrete pages of a large data set.

## 2. Design Philosophy
Clear, predictable navigation through lists.

## 3. Problem Statement
Loading 1,000 meetings at once crashes the browser. We must paginate.

## 4. UX Goals
* Provide context on total pages.
* Allow quick jumps (Next/Prev).

## 5. Usage Guidelines
* Use at the bottom of data tables.

## 6. When to Use
* Meeting Lists, Admin Member lists.

## 7. When NOT to Use
* Feed views (like the Dashboard "Recent Meetings") should use infinite scroll or a simple "Load More" button instead of numbered pagination.

## 8. Component Anatomy
* Container (Nav).
* List (Flex row).
* Previous Button.
* Page Number Links (e.g., 1, 2, 3).
* Ellipsis (for skipped page ranges).
* Next Button.

## 9. Variants
* Default.

## 10. Sizes
* Uses `size="icon"` for number buttons.

## 11. States
* Active Page (`variant="outline"` or distinct styling).
* Disabled (Prev button on Page 1).

## 12. Layout Rules
* Centered horizontally at the bottom of a list.

## 13. Content Guidelines
* N/A.

## 14. Icon Rules
* `ChevronLeft` and `ChevronRight`.

## 15. Color System
* Active page uses standard button outline or primary color.

## 16. Typography
* `text-sm`.

## 17. Spacing
* `gap-1`.

## 18. Motion
* None.

## 19. Accessibility
* Uses `<nav aria-label="pagination">`.
* Active link has `aria-current="page"`.

## 20. Keyboard Interaction
* Standard tabbing.

## 21. Responsive Behavior
* On mobile, hide the middle page numbers and just show `Prev [Page X of Y] Next`.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* N/A.

## 24. API Specification
```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

## 25. Props Reference
* N/A (Composite).

## 26. Events
* N/A.

## 27. Composition
* Heavily relies on standard `<Button>` components styled as links.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Total pages = 1 (Hide pagination).

## 31. Performance
* Cheap.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Mobile View.

## 35. Figma Mapping
* `Navigation/Pagination`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add pagination`

## 37. Tailwind Mapping
* Combines flexbox and button variants.

## 38. Implementation Notes
* Usually, this component just outputs `href` links that update the URL query parameters (e.g., `?page=2`). Next.js Server Components then handle the data fetching.

## 39. QA Checklist
* Test mobile viewport truncation.

## 40. Acceptance Criteria
* Accessible nav structure.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* Ensure we use cursor-based pagination on the backend for performance, even if the frontend renders page numbers (which is a UX compromise).
