---
Title: MeetingMind — Component: Date Picker
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/forms/calendar.md
---

# MeetingMind Component: Date Picker

## 1. Overview
A popover component containing a Calendar to select a specific date or date range.

## 2. Design Philosophy
Text inputs for dates are prone to formatting errors (MM/DD/YYYY vs DD/MM/YYYY). A visual picker removes ambiguity.

## 3. Problem Statement
Filtering meetings by date requires a standardized input format.

## 4. UX Goals
* Fast selection of common dates.

## 5. Usage Guidelines
* Use in the Meeting List filter.

## 6. When to Use
* Selecting start/end dates.

## 7. When NOT to Use
* When selecting a year far in the past (e.g., Date of Birth). A text input or native select is better for extreme jumps.

## 8. Component Anatomy
* Trigger (Looks like an Input with a Calendar icon).
* Popover Content.
* Calendar Component.

## 9. Variants
* Single Date.
* Date Range (Requires picking two dates).

## 10. Sizes
* Trigger matches standard `h-10`.

## 11. States
* Open/Closed.

## 12. Layout Rules
* Popover positions automatically.

## 13. Content Guidelines
* Display formatted date in the trigger (e.g., "Jan 23, 2026").

## 14. Icon Rules
* Use `Calendar` icon in the trigger.

## 15. Color System
* Inherits from Popover and Calendar.

## 16. Typography
* `text-sm`.

## 17. Spacing
* Popover padding `p-0` (Calendar handles internal padding).

## 18. Motion
* Popover scale/fade.

## 19. Accessibility
* Complex ARIA handled by Radix (Popover) and react-day-picker (Calendar).

## 20. Keyboard Interaction
* Enter to open. Arrow keys to navigate days.

## 21. Responsive Behavior
* On mobile, date pickers are notoriously difficult. Ensure the popover doesn't fall off-screen, or fall back to native `<input type="date">` on mobile.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`.

## 24. API Specification
A composite component.

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline"><CalendarIcon /> Pick a date</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>
```

## 25. Props Reference
* Takes `date` state.

## 26. Events
* `onSelect`.

## 27. Composition
* Combines `Popover`, `Button`, `Calendar`.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Validation on the trigger.

## 30. Edge Cases
* Timezones. (Store as UTC, display as Local).

## 31. Performance
* `react-day-picker` is slightly heavy but standard.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Single, Range.

## 35. Figma Mapping
* `Core/DatePicker`

## 36. shadcn/ui Mapping
* Described as a pattern combining `popover` and `calendar`.

## 37. Tailwind Mapping
* Standard popover classes.

## 38. Implementation Notes
* Use `date-fns` for formatting the output string in the trigger.

## 39. QA Checklist
* Test leap years and timezone edge cases.

## 40. Acceptance Criteria
* Accurately selects and formats a date.

## 41. Future Enhancements
* Quick select chips ("Last 7 Days", "This Month").

## 42. CTO Notes
* Dates are hard. Always use ISO 8601 strings when sending to the FastAPI backend.
