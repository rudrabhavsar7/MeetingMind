---
Title: MeetingMind — Component: Stats
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/card.md
---

# MeetingMind Component: Stats (Stat Card)

## 1. Overview
A specialized, compact Card used to display a single Key Performance Indicator (KPI) or metric.

## 2. Design Philosophy
Numbers should be big and obvious. Stat cards provide at-a-glance summaries for the Dashboard.

## 3. Problem Statement
Dashboard overviews need a way to summarize total data volume quickly without making the user count table rows.

## 4. UX Goals
* Highlight key numbers.
* Provide trend context (e.g., "+5% from last month").

## 5. Usage Guidelines
* Use in a grid layout (e.g., 3-4 columns) at the top of the Dashboard.

## 6. When to Use
* Total Meetings, Total Hours Recorded, Action Items Pending.

## 7. When NOT to Use
* Inside deep detailed views.

## 8. Component Anatomy
* Container (Card).
* Header (Label + Optional Icon).
* Value (Large Number).
* Trend/Subtext (Small text below the number).

## 9. Variants
* Default.

## 10. Sizes
* Fluid width, fixed padding.

## 11. States
* Static.

## 12. Layout Rules
* Header is `flex justify-between items-center`.

## 13. Content Guidelines
* Values should be formatted (e.g., "1,234" instead of "1234").

## 14. Icon Rules
* Use a muted icon in the top right corner representing the metric (e.g., `Video` for meetings).

## 15. Color System
* Same as Card. Trend text can be `--success` (Green) or `--destructive` (Red) based on the metric meaning.

## 16. Typography
* Label: `text-sm font-medium text-muted-foreground`.
* Value: `text-2xl font-bold`.
* Subtext: `text-xs text-muted-foreground`.

## 17. Spacing
* Padding `p-6`. Gap between elements is minimal.

## 18. Motion
* None (Can use a count-up animation on initial mount if desired, but not strictly necessary).

## 19. Accessibility
* Ensure trend colors (green/red) are accompanied by a + or - sign so colorblind users can interpret the trend.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Grids of stat cards usually drop to 1-column or 2-column layouts on mobile.

## 22. Dark Mode
* Inherited from Card.

## 23. Design Tokens
* `--card`.

## 24. API Specification
Built using standard `Card` primitives.

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Total Revenue
    </CardTitle>
    <svg className="h-4 w-4 text-muted-foreground">...</svg>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$45,231.89</div>
    <p className="text-xs text-muted-foreground">
      +20.1% from last month
    </p>
  </CardContent>
</Card>
```

## 25. Props Reference
* N/A.

## 26. Events
* N/A.

## 27. Composition
* Combines Card primitives.

## 28. AI Usage Guidelines
* Can be used to show "Time Saved by AI" or "Action Items Extracted".

## 29. Error Handling
* Show a Skeleton while the stat is fetching. If the fetch fails, show a "-" instead of a number, or a small error icon.

## 30. Edge Cases
* Extremely large numbers (e.g., 100,000,000) might break the layout. Use abbreviation functions (e.g., "100M").

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Dashboard Stat Card.

## 35. Figma Mapping
* `DataDisplay/StatCard`

## 36. shadcn/ui Mapping
* Demonstrated in the shadcn/ui Dashboard template.

## 37. Tailwind Mapping
* Standard Card classes.

## 38. Implementation Notes
* Extract into a `<StatCard title="..." value="..." />` component to avoid rewriting the verbose Card boilerplate 4 times on the dashboard.

## 39. QA Checklist
* Verify large numbers format correctly with commas/abbreviations.

## 40. Acceptance Criteria
* Clear, highly legible numbers.

## 41. Future Enhancements
* Sparkline charts embedded in the background of the card.

## 42. CTO Notes
* N/A.
