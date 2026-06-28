---
Title: MeetingMind — Component: Radio Group
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Radio Group

## 1. Overview
A set of checkable buttons where only one button can be checked at a time.

## 2. Design Philosophy
Provides all mutually exclusive options visible at once, requiring fewer clicks than a Select dropdown.

## 3. Problem Statement
When asking a user to choose between 2-4 distinct, mutually exclusive options (like Export Format: PDF vs DOCX), a Select hides the options, and a Checkbox allows invalid multiple selections.

## 4. UX Goals
* Ensure only one selection is possible.
* Make all options visible at a glance.

## 5. Usage Guidelines
* Use for 2-4 mutually exclusive options.

## 6. When to Use
* Export format selection.
* Workspace visibility settings (Public/Private).

## 7. When NOT to Use
* For more than 5 options (Use `Select`).
* For boolean toggles (Use `Switch` or `Checkbox`).

## 8. Component Anatomy
* Radio Group Container.
* Radio Button (Outer circle, Inner dot).
* Label.

## 9. Variants
* Default.

## 10. Sizes
* Button is `h-4 w-4`.

## 11. States
* Unchecked, Checked, Focus, Disabled.

## 12. Layout Rules
* Options can be stacked vertically (default) or horizontally (if space permits and labels are short).

## 13. Content Guidelines
* Labels must be clear and distinct.

## 14. Icon Rules
* N/A.

## 15. Color System
* Inner dot uses `--primary`.

## 16. Typography
* Text matches standard body text.

## 17. Spacing
* Group spacing usually `gap-2` (vertical).

## 18. Motion
* Inner dot scales in slightly when checked.

## 19. Accessibility
* Uses Radix `RadioGroup` and `RadioGroupItem` (`role="radiogroup"` and `role="radio"`).
* Must support arrow key navigation.

## 20. Keyboard Interaction
* Tab into the group. Arrow keys move selection between items.

## 21. Responsive Behavior
* Horizontal groups should wrap on mobile.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<RadioGroup defaultValue="pdf">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="pdf" id="r1" />
    <Label htmlFor="r1">PDF</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="docx" id="r2" />
    <Label htmlFor="r2">DOCX</Label>
  </div>
</RadioGroup>
```

## 25. Props Reference
* Radix UI props.

## 26. Events
* `onValueChange`.

## 27. Composition
* Needs `Label` components.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Border turns red if required but empty.

## 30. Edge Cases
* N/A.

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Core/Radio`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add radio-group`

## 37. Tailwind Mapping
* `aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background`

## 38. Implementation Notes
* Make sure each item has a unique `value` prop.

## 39. QA Checklist
* Test arrow key navigation.

## 40. Acceptance Criteria
* Mutually exclusive selection.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
