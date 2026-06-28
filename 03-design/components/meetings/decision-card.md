---
Title: MeetingMind — Component: Decision Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/card.md
---

# MeetingMind Component: Decision Card

## 1. Overview
A specialized card highlighting a final conclusion or decision reached during a meeting, as extracted by the AI.

## 2. Design Philosophy
Decisions are the "why" of a meeting. While Action Items say "who will do what," Decisions document "what we agreed upon." They need to stand out as immutable records.

## 3. Problem Statement
Users forget *why* a decision was made three months later. Hunting through a 60-minute transcript to find the exact moment of agreement is tedious.

## 4. UX Goals
* Clearly state the decision.
* Provide context (who agreed, when).
* Differentiate visually from an Action Item or Insight.

## 5. Usage Guidelines
* Used on the Meeting Details page (Decisions tab or inline with Summary).
* Used on the overarching Project/Workspace view to track historical decisions.

## 6. When to Use
* Presenting LLM-extracted decisions.

## 7. When NOT to Use
* For tasks with an assignee (Use `ActionItem`).

## 8. Component Anatomy
* Container (Card with distinct border, often using an Indigo/Purple accent).
* Header: "Decision" label + Sparkles Icon.
* Title: The decision itself (e.g., "Migrate to Next.js 15").
* Body: The rationale or context provided by the AI.
* Footer: Timestamp Citation and Key Approvers (Avatars).

## 9. Variants
* Default.

## 10. Sizes
* `w-full` for lists, or grid sizing.

## 11. States
* Hover (if clickable to view more details).

## 12. Layout Rules
* Standard Card layout.

## 13. Content Guidelines
* Title should be punchy. Body should provide the "Why."

## 14. Icon Rules
* `Gavel` or `CheckSquare` can be used as a thematic icon.

## 15. Color System
* Subtle accent color. Default to `--primary` but consider a specific semantic color for decisions (e.g., Violet/Indigo) if `--primary` is overloaded. For now, use `--border` with a `--primary` icon.

## 16. Typography
* Title: `text-base font-semibold`.
* Context: `text-sm text-muted-foreground`.

## 17. Spacing
* Padding `p-4` or `p-5`.

## 18. Motion
* None.

## 19. Accessibility
* Standard card ARIA.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Fluid width.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--card`.

## 24. API Specification
```tsx
<Card className="flex flex-col justify-between">
  <CardHeader className="pb-2">
    <div className="flex items-center gap-2 text-primary">
      <Gavel className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase tracking-wider">Decision</span>
    </div>
    <CardTitle className="text-lg">Migrate to Next.js 15</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Agreed to upgrade to Next.js 15 to utilize the new React Compiler for performance gains, despite the required refactoring effort on the caching layer.
    </p>
  </CardContent>
  <CardFooter className="flex items-center justify-between">
    <Citation id="dec-1" />
    <div className="flex -space-x-2">
      <Avatar className="border-2 border-background"><AvatarFallback>AL</AvatarFallback></Avatar>
      <Avatar className="border-2 border-background"><AvatarFallback>MA</AvatarFallback></Avatar>
    </div>
  </CardFooter>
</Card>
```

## 25. Props Reference
* Extends Card.

## 26. Events
* N/A.

## 27. Composition
* Combines Card, Avatar, Citation.

## 28. AI Usage Guidelines
* Requires a specific prompt schema to extract `rationale` and `approvers` alongside the decision text.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* No approvers explicitly mentioned (Omit avatar group).

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Meetings/DecisionCard`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* Standard layout classes.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Clear, distinct record of an agreement.

## 41. Future Enhancements
* Ability to manually override or edit the AI's rationale text.

## 42. CTO Notes
* Extracting decisions is notoriously hard for LLMs compared to action items. Ensure the temperature is 0 and the prompt uses Chain of Thought to define what constitutes a "decision" vs a "suggestion."
