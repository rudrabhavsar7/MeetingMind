---
Title: MeetingMind — Component: Action Item
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-11
Dependencies: 03-design/components/forms/checkbox.md, 03-design/components/ai/ai-citation.md
---

# MeetingMind Component: Action Item

## 1. Overview
A specialized row component representing a single task extracted by the AI, complete with an assignee, status, and citation.

## 2. Design Philosophy
Action Items are the primary tangible value derived from a meeting. They must be highly interactive and clear.

## 3. Problem Statement
Bullet points in a summary are static. Users need to check them off, reassign them, or verify why the AI thought they were assigned a task.

## 4. UX Goals
* Instantly actionable (Checkbox).
* Verifiable (Citations).

## 5. Usage Guidelines
* Used in the "Action Items" tab of the Meeting Details page.

## 6. When to Use
* Rendering LLM-extracted tasks.

## 7. When NOT to Use
* For generic list data.

## 8. Component Anatomy
* Container (Bordered row).
* Checkbox (Left edge).
* Task Text.
* Assignee Chip (Avatar + Name).
* AI Citation Link (e.g., `[1]`).
* Context Menu (`...` for Edit/Delete).

## 9. Variants
* **Open:** Standard view.
* **Completed:** Text is struck through and muted.

## 10. Sizes
* `w-full`.

## 11. States
* Hover (Reveals Context Menu).

## 12. Layout Rules
* Flex row, `items-start` or `items-center`.

## 13. Content Guidelines
* Keep the task text direct and verb-led (e.g., "Draft the Q3 budget proposal").

## 14. Icon Rules
* N/A.

## 15. Color System
* Completed items drop to `opacity-50`.

## 16. Typography
* Text: `text-sm font-medium`.
* Completed: `line-through text-muted-foreground`.

## 17. Spacing
* Padding `p-4`.

## 18. Motion
* Smooth opacity transition on check.

## 19. Accessibility
* Must be a `<label>` linked to the `<input type="checkbox">` so clicking anywhere on the text toggles the state.

## 20. Keyboard Interaction
* Space toggles checkbox.

## 21. Responsive Behavior
* On mobile, Assignee chip might drop to a second row below the text.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--muted-foreground`.

## 24. API Specification
```tsx
<div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
  <Checkbox id="task-1" className="mt-1" />
  <div className="grid gap-1 flex-1">
    <label htmlFor="task-1" className="text-sm font-medium leading-none cursor-pointer">
      Finalize the Q3 marketing budget <Citation id="1" />
    </label>
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="secondary">@Maya</Badge>
    </div>
  </div>
</div>
```

## 25. Props Reference
* `task` (text), `assignee`, `isCompleted`, `onToggle`, `citations`.

## 26. Events
* `onToggle`.

## 27. Composition
* Combines Checkbox, Badge, Citation.

## 28. AI Usage Guidelines
* The backend uses a validated schema containing `text`, optional assignee/due date/confidence, and one or more source segment citations. Persisted AI-origin actions also reference their `AIProcessingRun`; a lone timestamp is not sufficient provenance.

## 29. Error Handling
* Can show a red toast if the toggle fails to save to the backend.

## 30. Edge Cases
* No assignee identified (Show "Unassigned").

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track completion rates of AI-generated action items.

## 34. Storybook Stories
* Open, Completed, Unassigned.

## 35. Figma Mapping
* `Meetings/ActionItem`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* Standard layout classes.

## 38. Implementation Notes
* Optimistically update the UI when the user clicks the checkbox, then revert if the API call fails.

## 39. QA Checklist
* Ensure clicking the text label toggles the checkbox.

## 40. Acceptance Criteria
* Functional, verifiable task row.

## 41. Future Enhancements
* Push directly to Jira/Asana via an integration button.

## 42. CTO Notes
* N/A.
