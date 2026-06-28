---
Title: MeetingMind — Component: Charts
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/colors.md
---

# MeetingMind Component: Charts

## 1. Overview
Data visualizations (Bar, Line, Pie charts) used to represent trends over time or categorical breakdowns.

## 2. Design Philosophy
Charts must look like they belong in the application, using the exact CSS custom properties (tokens) defined by the design system, rather than random harsh hex colors.

## 3. Problem Statement
Third-party charting libraries often look disjointed from the rest of the UI and are notoriously hard to theme for dark mode.

## 4. UX Goals
* Provide visual trend analysis.
* Match the brand aesthetic perfectly in Light and Dark modes.

## 5. Usage Guidelines
* Use on the Dashboard for aggregate metrics (e.g., "Meetings over the last 30 days").

## 6. When to Use
* Visualizing time-series data.

## 7. When NOT to Use
* When a simple Stat Card number suffices.

## 8. Component Anatomy
* Wrapper (Card).
* Chart Container (`ResponsiveContainer`).
* Axes (X/Y).
* Tooltip (Custom HTML tooltip rendering on hover).
* Data geometry (Bars, Lines).

## 9. Variants
* Bar Chart.
* Line Chart (smooth curves).

## 10. Sizes
* `w-full h-[350px]` is standard for a dashboard chart.

## 11. States
* Hover (Triggers tooltip and highlights hovered bar/line).

## 12. Layout Rules
* Usually wrapped in a standard `Card`.

## 13. Content Guidelines
* Axes labels must be legible.

## 14. Icon Rules
* N/A.

## 15. Color System
* Uses Shadcn UI's Chart CSS variables (`--chart-1`, `--chart-2`, etc.) defined in `global.css`.
* These variables map to harmonious HSL values (e.g., Emerald, Blue, Purple) that look good together and adjust automatically for dark mode.

## 16. Typography
* Tooltip text: `text-sm`.
* Axis ticks: `text-xs text-muted-foreground`.

## 17. Spacing
* N/A (Handled by the charting library canvas/SVG).

## 18. Motion
* Initial draw animations (sliding up or tracing lines).

## 19. Accessibility
* Provide a visually hidden `<table>` containing the raw data for screen readers, or ensure `aria-labels` are comprehensive on the chart wrapper.

## 20. Keyboard Interaction
* Tricky. Often relies on the screen-reader fallback table.

## 21. Responsive Behavior
* `ResponsiveContainer` ensures the SVG scales to fit mobile screens.

## 22. Dark Mode
* The `--chart-*` variables handle this seamlessly.

## 23. Design Tokens
* `--chart-1` through `--chart-5`.

## 24. API Specification
Built using `recharts` wrapped in shadcn's `<ChartContainer>`.

```tsx
<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <BarChart data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
  </BarChart>
</ChartContainer>
```

## 25. Props Reference
* Relies on Recharts API.

## 26. Events
* N/A.

## 27. Composition
* Heavily composed of Recharts primitives.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Use `ErrorState` if data fetch fails.

## 30. Edge Cases
* 0 values should still render an empty axis so the grid is visible.

## 31. Performance
* Recharts renders SVGs. Avoid rendering thousands of data points; aggregate data on the backend first.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Bar Chart, Line Chart.

## 35. Figma Mapping
* `DataDisplay/Chart`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add chart`

## 37. Tailwind Mapping
* Relies heavily on injecting the CSS variables into the `recharts` fill/stroke props.

## 38. Implementation Notes
* Shadcn's chart wrapper is a brilliant piece of engineering that binds Tailwind CSS variables directly into Recharts. Use it exactly as documented in shadcn/ui.

## 39. QA Checklist
* Toggle dark mode and ensure chart colors invert/adjust correctly without refreshing.

## 40. Acceptance Criteria
* Beautiful, themed data visualization.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* Standardize solely on Recharts + Shadcn wrapper. No Chart.js, no D3 directly.
