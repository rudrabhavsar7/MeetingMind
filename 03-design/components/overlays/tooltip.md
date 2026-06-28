---
Title: MeetingMind — Component: Tooltip
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Tooltip

## 1. Overview
A brief, transient text bubble that appears when hovering over or focusing on an element.

## 2. Design Philosophy
Tooltips provide progressive disclosure. They keep the UI clean by hiding explanatory text until the user expresses interest (via hover).

## 3. Problem Statement
Icon-only buttons save space but are often ambiguous to new users.

## 4. UX Goals
* Instantly clarify ambiguous elements.
* Must not interfere with clicking the underlying element.

## 5. Usage Guidelines
* Mandatory on all icon-only buttons.
* Useful for explaining disabled states (e.g., hovering a disabled "Save" button shows "No changes made").

## 6. When to Use
* Clarifying icons.
* Showing full text for truncated elements (`truncate`).

## 7. When NOT to Use
* For critical information needed to complete a task (put it on the screen).
* For interactive elements (Use `Popover` or `HoverCard`). Tooltips cannot contain links.

## 8. Component Anatomy
* Trigger (The element being hovered).
* Content (The text bubble).
* Arrow (Optional, points to the trigger).

## 9. Variants
* Default.

## 10. Sizes
* Text size `text-xs`.

## 11. States
* Hidden, Visible.

## 12. Layout Rules
* Uses Floating UI to position intelligently (top, bottom, left, right).

## 13. Content Guidelines
* Keep it very short (1-5 words). No periods unless it's a full sentence (rare).

## 14. Icon Rules
* Rarely used inside tooltips, unless showing a keyboard shortcut (e.g., `Cmd+S`).

## 15. Color System
* `bg-primary text-primary-foreground` (High contrast, inverted look is common for tooltips) or `bg-popover text-popover-foreground`.
* Standardized on `bg-primary` for high visibility.

## 16. Typography
* `text-xs font-medium`.

## 17. Spacing
* `px-3 py-1.5`.

## 18. Motion
* Very fast fade-in (`animate-in fade-in zoom-in-95`).
* Requires a small delay (e.g., 300ms) before opening to prevent flashing when moving the mouse across the screen.

## 19. Accessibility
* Uses `role="tooltip"`.
* The Trigger must have `aria-describedby` pointing to the tooltip ID.
* Managed entirely by Radix UI.

## 20. Keyboard Interaction
* Opens on focus, closes on blur.

## 21. Responsive Behavior
* Tooltips are generally problematic on touch devices. Fall back to showing text on mobile if possible, or rely on long-press (which Radix handles).

## 22. Dark Mode
* Adjusts automatically.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>Add new meeting</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## 25. Props Reference
* `delayDuration`, `side`.

## 26. Events
* N/A.

## 27. Composition
* Needs a global `TooltipProvider` at the root of the app.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Very cheap.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default, Different sides.

## 35. Figma Mapping
* `Overlays/Tooltip`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add tooltip`

## 37. Tailwind Mapping
* `z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md` (Note: sometimes tweaked to `bg-primary` depending on theme).

## 38. Implementation Notes
* Make sure `asChild` is used on the `TooltipTrigger` when wrapping custom components like `Button` to prevent nested button rendering issues.

## 39. QA Checklist
* Test keyboard focus triggering.

## 40. Acceptance Criteria
* Delays briefly, then appears.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
