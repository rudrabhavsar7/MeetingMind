---
Title: MeetingMind — Component: Hover Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Hover Card

## 1. Overview
A popover that appears on hover, displaying rich preview content about the hovered element.

## 2. Design Philosophy
Provides a quick "peek" into complex data without requiring the user to navigate away or open a full modal.

## 3. Problem Statement
When scanning a transcript, a user sees an @mention of "@Alex". They need to know Alex's role and email, but navigating to Alex's profile page disrupts their reading flow.

## 4. UX Goals
* Instant context.
* Interactive content inside (unlike a Tooltip).

## 5. Usage Guidelines
* Use for user previews (Avatar hover).
* Use for quick Meeting summaries (Hovering a meeting link).

## 6. When to Use
* Showing metadata.

## 7. When NOT to Use
* For critical actions.
* For simple text hints (Use `Tooltip`).

## 8. Component Anatomy
* Trigger (Often an inline text link or Avatar).
* Content Panel.

## 9. Variants
* Default.

## 10. Sizes
* `w-80` typical width.

## 11. States
* Open/Closed.

## 12. Layout Rules
* Positions via Floating UI.

## 13. Content Guidelines
* Include an Avatar, Name, Role, and perhaps recent activity.

## 14. Icon Rules
* N/A.

## 15. Color System
* `bg-popover text-popover-foreground`.

## 16. Typography
* Title: `text-sm font-semibold`.
* Subtext: `text-xs text-muted-foreground`.

## 17. Spacing
* `p-4`.

## 18. Motion
* Delay on open (usually 300-500ms) to prevent flashing when the mouse moves over a block of text containing many triggers.

## 19. Accessibility
* Hover cards are notoriously difficult for accessibility. The content must be reachable via keyboard (usually by tabbing to the trigger and waiting, or pressing Enter).

## 20. Keyboard Interaction
* Focus on trigger opens card.

## 21. Responsive Behavior
* Disabled on mobile (no hover state). Often replaced by a click -> Drawer interaction if the data is crucial.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`.

## 24. API Specification
```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">@nextjs</Button>
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <div className="flex justify-between space-x-4">
      <Avatar>
        <AvatarImage src="https://github.com/vercel.png" />
      </Avatar>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">@nextjs</h4>
        <p className="text-sm">The React Framework.</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

## 25. Props Reference
* Radix props.

## 26. Events
* `onOpenChange`.

## 27. Composition
* Combines Avatar, Typography.

## 28. AI Usage Guidelines
* Hovering an AI-extracted Action Item could show a HoverCard indicating exactly which section of the transcript generated that item.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Moving mouse from trigger into the card (Radix handles the collision bounds so it doesn't close prematurely).

## 31. Performance
* Avoid fetching heavy API data blindly on hover. Add a small intentional delay (`openDelay={500}`) before firing the fetch request.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* User Profile preview.

## 35. Figma Mapping
* `Overlays/HoverCard`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add hover-card`

## 37. Tailwind Mapping
* Standard popover classes.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Test the mouse tunnel (moving diagonally from trigger to content without it closing).

## 40. Acceptance Criteria
* Delays slightly, then shows rich preview.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
