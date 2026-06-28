---
Title: MeetingMind — Component: Meeting Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/card.md
---

# MeetingMind Component: Meeting Card

## 1. Overview
A rich visual representation of a single meeting, used primarily on the Dashboard and Meeting List grid view.

## 2. Design Philosophy
Users need to identify a past meeting instantly. Visual anchors (like participants' faces and tags) are faster to scan than plain text titles.

## 3. Problem Statement
A table view of meetings is too dense for the main dashboard. We need an engaging, scannable summary.

## 4. UX Goals
* Surface key metadata (Date, Duration, Participants, Tags).
* Provide quick actions without navigating to the details page.

## 5. Usage Guidelines
* Use in Grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

## 6. When to Use
* Dashboard "Recent Meetings" section.

## 7. When NOT to Use
* When the user needs to mass-edit 50 meetings at once (Use `Table`).

## 8. Component Anatomy
* Container (Standard interactive `Card`).
* Header: Title and Date.
* Body: Brief 1-2 sentence AI summary (if available).
* Footer: Avatar group (participants) and Duration badge.
* Context Menu: Triggered by a `...` button in the top right.

## 9. Variants
* **Processing:** Overlays a subtle loading spinner/progress bar if the meeting is currently being analyzed.
* **Default:** Standard view.

## 10. Sizes
* Fluid width. Fixed or min-height to ensure grid alignment.

## 11. States
* Hover: `cursor-pointer hover:border-primary/50 hover:shadow-md`.

## 12. Layout Rules
* Flex column with `justify-between` to push the footer to the bottom evenly across cards in a row.

## 13. Content Guidelines
* Title truncates at 1 line. Summary truncates at 2 lines (`line-clamp-2`).

## 14. Icon Rules
* Use a `Calendar` icon next to the date.
* Use a `Clock` icon next to the duration.

## 15. Color System
* Standard Card colors.

## 16. Typography
* Title: `text-lg font-semibold`.

## 17. Spacing
* Internal padding `p-5`.

## 18. Motion
* Subtle transform scale or shadow increase on hover.

## 19. Accessibility
* The entire card should be wrapped in an `<a>` or `<Link>` tag to navigate to the details page, but beware of nesting the `...` dropdown menu inside the anchor (HTML doesn't allow nested interactive elements). Use absolute positioning for the dropdown trigger to overlay it, or handle clicks programmatically via `onClick`.

## 20. Keyboard Interaction
* Enter to open meeting details.

## 21. Responsive Behavior
* Grids switch to 1 column on mobile.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--card`, `--primary`.

## 24. API Specification
```tsx
<MeetingCard 
  id="m_123"
  title="Q3 Strategy Planning"
  date="2026-10-15T14:00:00Z"
  durationSeconds={3600}
  participants={[{ name: "Maya", avatar: "url" }]}
  summary="Discussed the new product launch and allocated budget."
/>
```

## 25. Props Reference
* Meeting object data.

## 26. Events
* `onClick` (Navigates to `/meetings/[id]`).

## 27. Composition
* Uses Card, Avatar, Badge, DropdownMenu.

## 28. AI Usage Guidelines
* The body text is the first two sentences of the AI summary.

## 29. Error Handling
* If meeting failed processing, show a red error badge on the card.

## 30. Edge Cases
* No participants found: Omit the avatar group.
* Missing summary: Show "No summary available." in muted text.

## 31. Performance
* Avatar images must be optimized/lazy-loaded if displaying 20 cards at once.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track clicks to see which meetings drive engagement.

## 34. Storybook Stories
* Default, Processing, Long Text Truncation.

## 35. Figma Mapping
* `Meetings/MeetingCard`

## 36. shadcn/ui Mapping
* N/A (Custom composition of Card).

## 37. Tailwind Mapping
* N/A.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Ensure the `...` dropdown menu works and clicking it doesn't accidentally navigate to the meeting details page (use `e.stopPropagation()`).

## 40. Acceptance Criteria
* Clickable card with truncated summary.

## 41. Future Enhancements
* Skeleton state for loading the grid.

## 42. CTO Notes
* Standardize on this card for all grid views.
