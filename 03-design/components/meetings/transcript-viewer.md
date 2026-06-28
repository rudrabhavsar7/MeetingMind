---
Title: MeetingMind — Component: Transcript Viewer
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/meetings/speaker-chip.md
---

# MeetingMind Component: Transcript Viewer

## 1. Overview
The core reading interface for the raw meeting dialogue. It displays a scrolling list of spoken segments, complete with speaker identification and timestamps.

## 2. Design Philosophy
Reading a transcript is fatiguing. The interface must prioritize legibility, clear speaker separation, and easy navigation (seeking to timestamps).

## 3. Problem Statement
Raw VTT/SRT text is impossible for business users to read comfortably.

## 4. UX Goals
* Clear speaker distinction.
* Easy copying of text.
* Highlighting active segments (if audio/video is playing).

## 5. Usage Guidelines
* The primary view in the left/main pane of the Meeting Details page.

## 6. When to Use
* Displaying diarized speech.

## 7. When NOT to Use
* For the AI Summary (Use `AISummaryBlock`).

## 8. Component Anatomy
* Container (Scrollable area).
* Segment Block (A grouping of continuous speech by one speaker).
* Speaker Chip & Timestamp (Left side or top of block).
* Text Content.

## 9. Variants
* **Read-only:** Static text.
* **Editable (Future):** Users can click to correct words.

## 10. Sizes
* `h-full w-full` of its parent container.

## 11. States
* **Active:** The currently playing segment is highlighted (e.g., `bg-primary/10`).

## 12. Layout Rules
* Vertical flex layout for segments.

## 13. Content Guidelines
* Group consecutive segments from the same speaker within a short timeframe (e.g., < 2 seconds gap) into a single visual block to reduce UI clutter.

## 14. Icon Rules
* N/A.

## 15. Color System
* Text: `text-foreground`.
* Active background: `bg-primary/5` or `bg-muted`.

## 16. Typography
* Text: `text-base leading-relaxed` (Optimize for long-form reading).

## 17. Spacing
* Padding between distinct speaker blocks: `py-6`.
* Margins inside a block: `mb-2`.

## 18. Motion
* Smooth scrolling when jumping to a timestamp via a Citation link.

## 19. Accessibility
* Provide a "Skip to summary" link at the top for screen readers.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* On mobile, speaker names move above the text rather than sitting in a left-aligned gutter.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--foreground`.

## 24. API Specification
```tsx
<TranscriptViewer>
  {segments.map(segment => (
    <TranscriptBlock 
      key={segment.id}
      speaker={segment.speaker}
      startTime={segment.start}
      text={segment.text}
      isActive={currentTime >= segment.start && currentTime <= segment.end}
    />
  ))}
</TranscriptViewer>
```

## 25. Props Reference
* Takes an array of diarized segments.

## 26. Events
* `onWordClick` or `onSegmentClick` (to seek the media player).

## 27. Composition
* Uses `SpeakerChip`.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* If transcript is empty/failed, show an EmptyState.

## 30. Edge Cases
* Unknown speakers (Label as "Speaker 1").

## 31. Performance
* **CRITICAL:** Use `@tanstack/react-virtual` to virtualize the list. A 2-hour meeting will have thousands of DOM nodes and will crash the browser if rendered entirely at once.

## 32. Security Considerations
* Ensure no XSS if somehow the transcript text contains raw HTML (always escape transcript text).

## 33. Analytics Events
* Track text selection/copying to see what parts users find valuable.

## 34. Storybook Stories
* Default, Active Segment, Mobile Layout.

## 35. Figma Mapping
* `Meetings/TranscriptViewer`

## 36. shadcn/ui Mapping
* Custom layout.

## 37. Tailwind Mapping
* N/A.

## 38. Implementation Notes
* Implementing the "Active Segment Highlight" efficiently requires a ref to the media player's `currentTime` and updating the active state without triggering a full re-render of the massive virtualized list.

## 39. QA Checklist
* Test virtualization: Scroll quickly from top to bottom and ensure text renders without jank.

## 40. Acceptance Criteria
* Highly readable, virtualized list.

## 41. Future Enhancements
* Search inside transcript (Ctrl+F override) that highlights words and scrolls to them, overriding the browser's default search which fails on virtualized lists.

## 42. CTO Notes
* Virtualization is mandatory here. Do not ship a mapped array of divs.
