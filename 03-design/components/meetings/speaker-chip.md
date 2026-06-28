---
Title: MeetingMind — Component: Speaker Chip
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/avatar.md
---

# MeetingMind Component: Speaker Chip

## 1. Overview
A small UI element identifying the person speaking in the Transcript Viewer.

## 2. Design Philosophy
Speaker identification must be instantly recognizable without distracting from the text.

## 3. Problem Statement
Reading "Speaker 1:" repeatedly is tiring. Humans identify faces and colors faster than names.

## 4. UX Goals
* Deterministic coloring (Speaker A is always Blue, Speaker B is always Green).
* Compact footprint.

## 5. Usage Guidelines
* Used alongside every new speech block in the transcript.

## 6. When to Use
* Transcript viewer.
* Action Item assignment lists.

## 7. When NOT to Use
* As a general filter toggle (Use a standard `Chip` instead).

## 8. Component Anatomy
* Container.
* Avatar (Image or initials).
* Name (Text).

## 9. Variants
* **Standard:** Avatar + Name.
* **Avatar Only:** For dense areas.

## 10. Sizes
* `h-6` (Very compact).

## 11. States
* Hover (Can reveal a popover to rename the speaker if diarization was wrong).

## 12. Layout Rules
* Inline flex.

## 13. Content Guidelines
* Truncate long names to first name only (e.g., "Alexander" -> "Alex").

## 14. Icon Rules
* N/A.

## 15. Color System
* Avatar background color should be generated deterministically from a hash of the speaker's name/ID, so it remains consistent across the entire transcript.

## 16. Typography
* `text-sm font-semibold`.

## 17. Spacing
* Gap between avatar and name: `gap-2`.

## 18. Motion
* None.

## 19. Accessibility
* The text name is sufficient for screen readers.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* N/A.

## 22. Dark Mode
* Ensure the deterministic hash colors are legible in dark mode (avoid dark blue on black).

## 23. Design Tokens
* N/A.

## 24. API Specification
```tsx
<div className="flex items-center gap-2">
  <Avatar className="h-6 w-6">
    <AvatarFallback className="bg-blue-100 text-blue-700">M</AvatarFallback>
  </Avatar>
  <span className="text-sm font-semibold text-foreground">Maya</span>
</div>
```

## 25. Props Reference
* `name`, `avatarUrl`, `speakerId`.

## 26. Events
* `onClick` (Optional: Edit speaker name).

## 27. Composition
* Uses Avatar.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Unknown speakers assigned "Speaker 1", "Speaker 2".

## 31. Performance
* Very cheap.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Known Speaker, Unknown Speaker.

## 35. Figma Mapping
* `Meetings/SpeakerChip`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* See API block.

## 38. Implementation Notes
* Create a utility function `getSpeakerColor(speakerId)` that maps IDs to a predefined palette of 10-12 Tailwind color classes (e.g., `bg-indigo-500`, `bg-emerald-500`) to ensure contrast and consistency.

## 39. QA Checklist
* Verify the same speaker gets the same color throughout the transcript.

## 40. Acceptance Criteria
* Clear, colorful identification.

## 41. Future Enhancements
* Hover to view speaking time stats.

## 42. CTO Notes
* N/A.
