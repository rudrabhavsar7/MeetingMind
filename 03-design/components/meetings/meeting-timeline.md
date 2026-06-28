---
Title: MeetingMind — Component: Meeting Timeline
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/timeline.md
---

# MeetingMind Component: Meeting Timeline

## 1. Overview
A visual representation of the meeting's progression, often rendered as a horizontal scrubber bar or a vertical list of major events (join/leave, topic shifts).

## 2. Design Philosophy
Provides a bird's-eye view of the meeting's structure.

## 3. Problem Statement
Users need a way to scrub through the audio/video while seeing where the important parts (decisions, action items, high engagement) happened.

## 4. UX Goals
* Visual correlation of time and events.

## 5. Usage Guidelines
* Attached to the Audio/Video player.

## 6. When to Use
* Media playback.

## 7. When NOT to Use
* If there is no media to play (e.g., purely text-based meeting note).

## 8. Component Anatomy
* Track (Horizontal bar).
* Progress Fill (How much has played).
* Scrubber Handle.
* Event Markers (Dots/icons placed along the track).
* Tooltip (Appears on hover over a marker).

## 9. Variants
* Horizontal (Media Scrubber).
* Vertical (Activity Log).

## 10. Sizes
* `w-full` for horizontal.

## 11. States
* Playing, Paused, Hovering (seeking).

## 12. Layout Rules
* Requires precise absolute positioning of markers based on percentage of total duration.

## 13. Content Guidelines
* Tooltips should describe the event (e.g., "Topic: Budget Review").

## 14. Icon Rules
* Use different colored dots for different event types (Blue for topics, Purple for decisions).

## 15. Color System
* Track: `bg-muted`.
* Fill: `bg-primary`.

## 16. Typography
* Tooltips: `text-xs`.

## 17. Spacing
* N/A.

## 18. Motion
* Smooth progress fill.

## 19. Accessibility
* Must be a standard `<input type="range">` under the hood for keyboard seeking.

## 20. Keyboard Interaction
* Left/Right arrows to seek.

## 21. Responsive Behavior
* Fluid width.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<div className="relative h-2 w-full rounded-full bg-muted">
  {/* Progress */}
  <div className="absolute left-0 h-full rounded-full bg-primary" style={{ width: '45%' }} />
  
  {/* Markers */}
  <div className="absolute top-1/2 -mt-1.5 h-3 w-3 rounded-full bg-blue-500 shadow" style={{ left: '20%' }} />
  <div className="absolute top-1/2 -mt-1.5 h-3 w-3 rounded-full bg-purple-500 shadow" style={{ left: '60%' }} />
  
  {/* Native Slider Overlay (opacity 0) for interaction */}
  <input type="range" className="absolute inset-0 w-full opacity-0 cursor-pointer" />
</div>
```

## 25. Props Reference
* `duration`, `currentTime`, `markers[]`.

## 26. Events
* `onSeek`.

## 27. Composition
* Uses Slider primitive.

## 28. AI Usage Guidelines
* Markers are populated via AI-extracted timestamps.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Markers too close together (might overlap visually).

## 31. Performance
* Progress updates every 100ms; use a local ref/state for the scrubber to avoid re-rendering the whole page.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Standard scrubber.

## 35. Figma Mapping
* `Meetings/TimelineScrubber`

## 36. shadcn/ui Mapping
* Based on `Slider`.

## 37. Tailwind Mapping
* See API.

## 38. Implementation Notes
* Calculating percentages: `(markerTime / totalDuration) * 100`.

## 39. QA Checklist
* Verify markers align correctly with the audio.

## 40. Acceptance Criteria
* Accurate, interactive media scrubber with metadata overlay.

## 41. Future Enhancements
* Render an audio waveform in the background of the track.

## 42. CTO Notes
* Building a custom HTML5 media player wrapper is always harder than it looks. Keep the DOM updates tight.
