---
Title: MeetingMind — Component: Calendar
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Calendar

## 1. Overview
The underlying interactive month grid used for date selection.

## 2. Design Philosophy
Should look like a standard, modern calendar grid.

## 3. Problem Statement
Building a calendar from scratch is a massive accessibility and date-math headache.

## 4. UX Goals
* Easy month navigation.

## 5. Usage Guidelines
* Usually embedded inside a `DatePicker` popover.

## 6. When to Use
* Selecting dates.

## 7. When NOT to Use
* As a full-page scheduling app (MeetingMind is not Google Calendar).

## 8. Component Anatomy
* Month/Year Header with Next/Prev buttons.
* Day of week header row (S M T W T F S).
* Grid of day buttons.

## 9. Variants
* Single select.
* Range select.

## 10. Sizes
* Generally fixed width (~280px).

## 11. States
* Selected (`bg-primary text-primary-foreground`).
* Today (`bg-accent text-accent-foreground`).
* Outside Month (Muted text).

## 12. Layout Rules
* Grid layout for days.

## 13. Content Guidelines
* N/A.

## 14. Icon Rules
* `ChevronLeft` and `ChevronRight` for month navigation.

## 15. Color System
* Uses primary for selection.

## 16. Typography
* `text-sm`.

## 17. Spacing
* `p-3`.

## 18. Motion
* None.

## 19. Accessibility
* Uses `react-day-picker` which provides full ARIA grid navigation.

## 20. Keyboard Interaction
* Full grid navigation using arrow keys.

## 21. Responsive Behavior
* Static.

## 22. Dark Mode
* Adjusts automatically.

## 23. Design Tokens
* `--primary`, `--accent`.

## 24. API Specification
```tsx
import { Calendar } from "@/components/ui/calendar"
<Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
```

## 25. Props Reference
* `react-day-picker` props.

## 26. Events
* `onSelect`, `onMonthChange`.

## 27. Composition
* N/A.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Disabled dates (e.g., future dates for meeting capture/import records).

## 30. Edge Cases
* N/A.

## 31. Performance
* Fair.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Core/Calendar`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add calendar`

## 37. Tailwind Mapping
* Heavily relies on targeting `.rdp` classes to override default `react-day-picker` styles.

## 38. Implementation Notes
* Ensure the CSS overrides provided by shadcn/ui are kept up to date with `react-day-picker` version bumps.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Fully keyboard accessible.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
