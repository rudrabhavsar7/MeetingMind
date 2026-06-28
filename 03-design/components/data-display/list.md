---
Title: MeetingMind — Component: List
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: List

## 1. Overview
A vertically stacked list of distinct items, often used for repeating data that doesn't fit neatly into a Table.

## 2. Design Philosophy
Lists should be easy to scan and interact with on both mobile and desktop.

## 3. Problem Statement
Tables are too dense and rigid for simple entity lists (like a list of Action Items), especially on mobile.

## 4. UX Goals
* Highly legible.
* Clear hit areas for interactive rows.

## 5. Usage Guidelines
* Use for Action Items, Notifications, and Search Results.

## 6. When to Use
* Unstructured or loosely structured repeating data.

## 7. When NOT to Use
* For strict multi-column data (Use `Table`).

## 8. Component Anatomy
* Container (Usually a `ul` or `div`).
* List Item (Usually an `li` or `div`).
* Leading Visual (Avatar, Icon, Checkbox).
* Primary Text.
* Secondary Text.
* Trailing Action (Button, DropdownMenu).

## 9. Variants
* **Divided:** `divide-y` separating items with a border.
* **Flush:** No borders.
* **Card List:** Each item looks like a mini-card with gaps between them.

## 10. Sizes
* `w-full`.

## 11. States
* Hover (on interactive items).

## 12. Layout Rules
* Flex row for each item (aligning Leading, Center, Trailing elements).

## 13. Content Guidelines
* Primary text should be prominent.
* Truncate long descriptions with `line-clamp`.

## 14. Icon Rules
* Use leading icons to indicate the type of item (e.g., `CheckCircle` for completed tasks).

## 15. Color System
* Primary Text: `text-foreground`.
* Secondary Text: `text-muted-foreground`.
* Hover state: `hover:bg-muted/50`.

## 16. Typography
* Primary: `text-sm font-medium`.
* Secondary: `text-sm`.

## 17. Spacing
* Item padding: `py-3 px-4`.
* Gap between text: `gap-1` (vertical flex).

## 18. Motion
* None.

## 19. Accessibility
* If purely data, use `<ul>` and `<li>`.
* If a menu of actions, use `role="menu"`.

## 20. Keyboard Interaction
* Focus outlines if items are links/buttons.

## 21. Responsive Behavior
* Fluid width. Text wraps or truncates.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--muted`.

## 24. API Specification
Custom composition, not a strict shadcn primitive.

```tsx
<ul className="divide-y rounded-md border">
  <li className="flex items-center justify-between p-4 hover:bg-muted/50">
    <div className="flex items-center gap-4">
      <Checkbox />
      <div>
        <p className="text-sm font-medium">Follow up with client</p>
        <p className="text-sm text-muted-foreground">Assigned to Alex</p>
      </div>
    </div>
    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
  </li>
</ul>
```

## 25. Props Reference
* N/A.

## 26. Events
* N/A.

## 27. Composition
* Combines Checkbox, Button, Typography.

## 28. AI Usage Guidelines
* Use for the AI-generated Action Items list, allowing users to check them off directly.

## 29. Error Handling
* Wrap in an `EmptyState` if array length is 0.

## 30. Edge Cases
* N/A.

## 31. Performance
* Virtualize if > 100 items.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Action Items list, Notifications list.

## 35. Figma Mapping
* `DataDisplay/List`

## 36. shadcn/ui Mapping
* Does not exist. Use Tailwind `divide-y`.

## 37. Tailwind Mapping
* `flex flex-col divide-y`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Check line height on very long item descriptions.

## 40. Acceptance Criteria
* Cleanly aligns varied content types.

## 41. Future Enhancements
* Drag and drop sorting support using `dnd-kit`.

## 42. CTO Notes
* N/A.
