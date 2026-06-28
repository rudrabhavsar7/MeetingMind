---
Title: MeetingMind — Component: Topic Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/card.md
---

# MeetingMind Component: Topic Card

## 1. Overview
A card representing a specific thematic segment or agenda item within a meeting.

## 2. Design Philosophy
Meetings are rarely about one single thing. Breaking a 60-minute meeting into 5 "Topics" makes it infinitely more browsable.

## 3. Problem Statement
A user is only interested in the "Q3 Budget" discussion of a 2-hour All Hands meeting. They don't want to read the rest.

## 4. UX Goals
* Provide a "table of contents" for the meeting.
* Act as a quick jump-link to a specific part of the transcript.

## 5. Usage Guidelines
* Used in the "Topics" or "Chapters" tab of the Meeting Details page.

## 6. When to Use
* Summarizing distinct segments of a meeting.

## 7. When NOT to Use
* For very short meetings (< 5 minutes).

## 8. Component Anatomy
* Container (Interactive Card).
* Header: Topic Title (e.g., "Budget Review").
* Subheader: Timestamp range (e.g., "14:05 - 22:30").
* Body: Brief 1-sentence summary of the topic.
* Play Button: Jump directly to the audio for this topic.

## 9. Variants
* Default.

## 10. Sizes
* `w-full` in a list, or grid sizing.

## 11. States
* Hover (reveals the Play button or highlights the card).

## 12. Layout Rules
* Flex row if in a tight list, flex col if in a grid.

## 13. Content Guidelines
* Keep the summary brief. It's an index, not the full document.

## 14. Icon Rules
* Use `Play` icon on hover.

## 15. Color System
* Standard Card.

## 16. Typography
* Title: `text-base font-medium`.
* Timestamp: `text-xs text-muted-foreground font-mono`.

## 17. Spacing
* `p-4`.

## 18. Motion
* Play button fades in on hover (desktop).

## 19. Accessibility
* Provide `aria-label` for the play button ("Play topic: Budget Review").

## 20. Keyboard Interaction
* Enter to play.

## 21. Responsive Behavior
* Play button should always be visible on mobile, as hover doesn't exist.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--card`.

## 24. API Specification
```tsx
<Card className="group relative cursor-pointer overflow-hidden transition-colors hover:border-primary/50">
  <CardHeader className="pb-2">
    <div className="flex justify-between items-start">
      <CardTitle className="text-base">Budget Review</CardTitle>
      <span className="text-xs font-mono text-muted-foreground">14:05 - 22:30</span>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Discussion surrounding the allocation of marketing funds for the upcoming product launch.
    </p>
  </CardContent>
  <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100 md:block hidden">
    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8">
      <Play className="h-4 w-4" />
    </Button>
  </div>
</Card>
```

## 25. Props Reference
* Extends Card.

## 26. Events
* `onClick` (Seeks media player and scrolls transcript).

## 27. Composition
* Uses Card, Button.

## 28. AI Usage Guidelines
* The LLM generates these chapters by analyzing natural topic shifts in the diarized transcript.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Overlapping topics (usually resolved by the LLM into linear chapters).

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track which topics are jumped to most frequently.

## 34. Storybook Stories
* Default, Hover state.

## 35. Figma Mapping
* `Meetings/TopicCard`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `group hover:border-primary/50`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Ensure clicking the card accurately jumps to the start timestamp.

## 40. Acceptance Criteria
* Clickable index card for meeting navigation.

## 41. Future Enhancements
* Embed a mini-waveform of the audio specifically for that segment.

## 42. CTO Notes
* Topic modeling / Segmentation is a distinct step in the NLP pipeline, usually run *before* the overall summary generation, as summarizing individual topics first yields a better final global summary.
