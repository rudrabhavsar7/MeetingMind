---
Title: MeetingMind — Component: Timeline
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Timeline

## 1. Overview
A vertical list of events displayed chronologically along a connecting line.

## 2. Design Philosophy
Shows progression over time.

## 3. Problem Statement
The Meeting Transcript is just a wall of text. It needs chronological structure to feel like a flowing conversation.

## 4. UX Goals
* Provide temporal context to data.

## 5. Usage Guidelines
* Used for the Transcript View.
* Used for the Meeting Processing Status (e.g., Uploaded -> Transcribing -> Analyzing -> Complete).

## 6. When to Use
* Event logs.
* Conversation threads.

## 7. When NOT to Use
* For unordered lists.

## 8. Component Anatomy
* Container.
* Event Item.
* Node/Dot (The point on the timeline).
* Line (Connecting the nodes).
* Content (Right side).
* Timestamp (Left side or inside content).

## 9. Variants
* Left-aligned (Line on the left, content on the right).
* Alternating (Line in middle, content alternates left/right - rarely used for professional tools).

## 10. Sizes
* Fluid width.

## 11. States
* Active Node (e.g., current speaking section).

## 12. Layout Rules
* CSS Grid or Flexbox with a specific width for the line track.

## 13. Content Guidelines
* Keep timestamps formatted consistently (`14:02`).

## 14. Icon Rules
* Nodes can optionally contain icons (e.g., User Avatars for the transcript).

## 15. Color System
* Line: `border-border` or `bg-muted`.
* Node: `bg-background border-primary`.

## 16. Typography
* Content: `text-sm`.
* Timestamp: `text-xs text-muted-foreground`.

## 17. Spacing
* Generous vertical padding (`pb-8`) between events.

## 18. Motion
* Optional: Active node highlight scales up slightly.

## 19. Accessibility
* Standard list (`<ul>`, `<li>`).

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Fluid.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--border`.

## 24. API Specification
Custom component (not native to shadcn).
```tsx
<Timeline>
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot />
      <TimelineConnector />
    </TimelineSeparator>
    <TimelineContent>
      <p>00:15 - Alex</p>
      <p>Let's get started.</p>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## 25. Props Reference
* N/A.

## 26. Events
* Click on timestamp to seek media.

## 27. Composition
* N/A.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Last item should not have a connector line below it.

## 31. Performance
* Very long timelines (1 hour transcript) must be virtualized using `@tanstack/react-virtual` to prevent DOM bloat.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Transcript Example.

## 35. Figma Mapping
* `DataDisplay/Timeline`

## 36. shadcn/ui Mapping
* Does not exist natively. Built custom using Tailwind flex utilities.

## 37. Tailwind Mapping
* `relative pl-6 border-l` on the container, absolute position for the dot `absolute -left-1.5`.

## 38. Implementation Notes
* Easiest implementation uses a left border on a wrapper div, and absolutely positioned dots sitting on that border.

## 39. QA Checklist
* Verify the line doesn't extend past the last item.

## 40. Acceptance Criteria
* Clear visual chronological flow.

## 41. Future Enhancements
* Highlight currently playing segment.

## 42. CTO Notes
* Virtualization is critical for the transcript view. A 60-minute meeting with 400 dialogue turns will lag if fully rendered.
