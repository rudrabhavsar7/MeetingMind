---
Title: MeetingMind — Component: Recording Status
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-10
Dependencies: 03-design/components/foundation/badge.md
---

# MeetingMind Component: Recording Status

## 1. Overview
A persistent, highly visible indicator that an active meeting is currently being recorded or transcribed live.

## 2. Design Philosophy
Privacy and transparency are critical. Users must always know if their microphone/camera is active and being recorded by the app.

## 3. Problem Statement
Silent background recording violates user trust.

## 4. UX Goals
* Unmissable but unobtrusive.
* Clearly indicate "Live" status.

## 5. Usage Guidelines
* Displayed globally (usually in the header or floating in a corner) while a live recording session is active.

## 6. When to Use
* Real-time meeting capture.

## 7. When NOT to Use
* For processing previously imported static files.

## 8. Component Anatomy
* Container (Pill/Badge).
* Pulsing Red Dot.
* Text ("Recording" or "00:15:30").
* Stop Button (Optional, if rendered as a floating control).

## 9. Variants
* **Header Badge:** Small, sits next to the user profile.
* **Floating Action Button (FAB):** Sits in the bottom corner with Stop/Pause controls.

## 10. Sizes
* Compact.

## 11. States
* Recording (Pulsing).
* Paused (Solid amber dot).

## 12. Layout Rules
* Fixed positioning if floating, or flex-aligned in the Header.

## 13. Content Guidelines
* Display the elapsed time to reassure the user that it hasn't crashed.

## 14. Icon Rules
* N/A.

## 15. Color System
* Indicator Dot: `bg-destructive` (Red is the universal color for recording).

## 16. Typography
* `text-sm font-medium font-mono` (for the timer).

## 17. Spacing
* `px-3 py-1`.

## 18. Motion
* Continuous slow CSS pulse animation on the red dot (`animate-pulse` or a custom ripple).

## 19. Accessibility
* `role="status"` and `aria-live="polite"`.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* N/A.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--destructive`.

## 24. API Specification
```tsx
<div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-sm">
  <div className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
  </div>
  <span className="text-sm font-medium font-mono">00:14:32</span>
</div>
```

## 25. Props Reference
* `isRecording`, `isPaused`, `elapsedSeconds`.

## 26. Events
* N/A (Display only).

## 27. Composition
* Custom HTML.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* If the microphone stream dies, change the text to "Mic disconnected" and the dot to yellow/red warning.

## 30. Edge Cases
* N/A.

## 31. Performance
* Use a lightweight `requestAnimationFrame` or a simple `setInterval` for the timer so it doesn't cause heavy React renders every second.

## 32. Security Considerations
* Visually reinforces that the browser tab is utilizing the `getUserMedia` API.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Recording, Paused, Error.

## 35. Figma Mapping
* `Meetings/RecordingStatus`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `animate-ping` for the ripple effect.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Ensure the timer formats correctly past 1 hour (e.g., `01:15:00`).

## 40. Acceptance Criteria
* Clear, pulsing indication of live capture.

## 41. Future Enhancements
* Embed a tiny audio visualizer (waveform) next to the timer to prove audio is being received.

## 42. CTO Notes
* Offscreen tab-capture and WebSocket state can diverge during service-worker restart or reconnect. The UI must render the authoritative state reported by the offscreen capture owner/backend rather than inferring it locally.
