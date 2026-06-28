---
Title: MeetingMind — Component: Table
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Table

## 1. Overview
A structured grid for displaying dense, tabular data (rows and columns).

## 2. Design Philosophy
Data tables should be clean, highly scannable, and support dense information without feeling cluttered.

## 3. Problem Statement
Cards are great for visual browsing, but comparing exact data points across 50 items requires a grid.

## 4. UX Goals
* Clear alignment.
* Interactive rows (hover, select).

## 5. Usage Guidelines
* Use for Lists of Meetings (Table View).
* Use for Workspace Members list.

## 6. When to Use
* Whenever data shares strict columns.

## 7. When NOT to Use
* For unstructured data.
* On mobile (Cards are usually better on mobile, as tables require horizontal scrolling).

## 8. Component Anatomy
* Wrapper (Handles overflow).
* Table (The `<table>` element).
* Header (`<thead>` and `<th>`).
* Body (`<tbody>` and `<tr>`).
* Cell (`<td>`).

## 9. Variants
* Default (Minimal borders).

## 10. Sizes
* `w-full`.

## 11. States
* Row hover (`hover:bg-muted/50`).
* Row selected (`data-[state=selected]:bg-muted`).

## 12. Layout Rules
* Horizontal scroll on overflow.

## 13. Content Guidelines
* Right-align numbers. Left-align text.
* Use `Badge` components for statuses within cells.

## 14. Icon Rules
* Use sorting icons (`ChevronUp`, `ChevronDown`) in headers.

## 15. Color System
* Header text: `text-muted-foreground`.
* Border bottom on rows: `border-b transition-colors`.

## 16. Typography
* Header: `text-sm font-medium`.
* Body: `text-sm`.

## 17. Spacing
* Cell padding: `p-4 align-middle`.

## 18. Motion
* Subtle background color transition on row hover.

## 19. Accessibility
* Must use standard HTML table elements (`table`, `th`, `td`) for screen readers to navigate the grid correctly. Do not build tables out of `div`s.

## 20. Keyboard Interaction
* N/A (unless using a complex data grid library).

## 21. Responsive Behavior
* The table wrapper MUST have `overflow-x-auto` to allow horizontal scrolling on mobile, preventing the page layout from breaking.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--muted`.

## 24. API Specification
```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[100px]">Invoice</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-medium">INV001</TableCell>
        <TableCell>Paid</TableCell>
        <TableCell className="text-right">$250.00</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

## 25. Props Reference
* N/A (HTML table elements).

## 26. Events
* N/A.

## 27. Composition
* Often used in conjunction with TanStack Table (React Table) for complex sorting, filtering, and pagination state.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Use `EmptyState` inside a single `TableRow` spanning all columns if data is empty.

## 30. Edge Cases
* Very long text in a cell (use `truncate` or `whitespace-nowrap`).

## 31. Performance
* Native tables render fast, but massive DOMs (>1000 rows) will drag. Use pagination or virtualization.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Empty State, Selected Rows.

## 35. Figma Mapping
* `DataDisplay/Table`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add table`

## 37. Tailwind Mapping
* `w-full caption-bottom text-sm`

## 38. Implementation Notes
* Shadcn provides styling wrappers around native `table` elements.
* For actual functionality (sorting, row selection), always pair with `@tanstack/react-table`.

## 39. QA Checklist
* Test horizontal scrolling on a narrow viewport.

## 40. Acceptance Criteria
* Accessible, responsive grid.

## 41. Future Enhancements
* Column resizing support.

## 42. CTO Notes
* Standardize on TanStack Table for headless table logic across the app.
