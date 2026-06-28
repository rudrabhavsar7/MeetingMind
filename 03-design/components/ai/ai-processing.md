---
Title: MeetingMind — Component: AI Processing
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/progress.md, 03-design/components/foundation/spinner.md
---

# MeetingMind Component: AI Processing

## 1. Overview
A specialized status indicator that shows the multi-stage progress of the AI backend (e.g., Audio Extraction -> Transcription -> Diarization -> Summary Generation).

## 2. Design Philosophy
LLM processing is inherently slow (often taking 1-2 minutes for a long meeting). Instead of a static spinner, showing detailed stage-by-stage progress reduces user anxiety and perceived wait time.

## 3. Problem Statement
Users abandon pages if they think the app has frozen. A generic "Processing..." text for 2 minutes is unacceptable UX.

## 4. UX Goals
* Provide transparency into backend Celery tasks.
* Keep the user entertained/informed while they wait.

## 5. Usage Guidelines
* Displayed on the Meeting Details page immediately after an upload, before the transcript is available.

## 6. When to Use
* Audio/Video ingestion.
* Mass transcript re-analysis.

## 7. When NOT to Use
* For fast RAG queries (< 5 seconds). Use a simple blinking cursor or small spinner for those.

## 8. Component Anatomy
* Container (Card or full-page flex container).
* Primary Progress Bar.
* Current Stage Text (e.g., "Extracting audio...").
* Checklist of stages (Pending, Active, Complete).

## 9. Variants
* **Inline:** Embedded inside a Card.
* **Full Page:** Used if the user lands directly on a processing meeting via URL.

## 10. Sizes
* `w-full max-w-md`.

## 11. States
* Processing.
* Success (Transitions out to the real content).
* Error (Halts and shows an error message with a retry button).

## 12. Layout Rules
* Centered vertically and horizontally if full-page.

## 13. Content Guidelines
* Use active verbs for stages: "Uploading audio", "Transcribing speech", "Identifying speakers", "Generating summary".

## 14. Icon Rules
* Use `CheckCircle` (green) for completed stages.
* Use `Loader2` (spinning) for the active stage.
* Use `Circle` (muted) for pending stages.

## 15. Color System
* Complete: `--success`.
* Active: `--primary`.

## 16. Typography
* Stage headers: `text-sm font-medium`.

## 17. Spacing
* Stack elements with `space-y-4`.

## 18. Motion
* Smooth width transition on the Progress bar.
* Fade-in for completed checkmarks.

## 19. Accessibility
* Use `aria-live="polite"` on the container that holds the "Current Stage Text".
* Provide `aria-valuenow` on the progress bar.

## 20. Keyboard Interaction
* N/A (Passive component).

## 21. Responsive Behavior
* Fits mobile widths.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--success`, `--primary`.

## 24. API Specification
```tsx
<AIProcessing status="transcribing" progress={45} />
```

## 25. Props Reference
* `status`: Enum of backend pipeline stages.
* `progress`: Number (0-100) representing total pipeline progress.

## 26. Events
* Typically listens to a WebSocket or polling interval to update state.

## 27. Composition
* Combines Progress, Icons, Card.

## 28. AI Usage Guidelines
* This *is* the AI pipeline tracker.

## 29. Error Handling
* Must gracefully handle WebSocket disconnects (fallback to polling) and render a clear error if the Celery task fails.

## 30. Edge Cases
* Fast-forwarding: If a cached result is found, it should animate quickly through 100% rather than instantly vanishing, to provide a sense of completion.

## 31. Performance
* Ensure the polling/websocket interval isn't spamming the server (e.g., 1-2 seconds max frequency).

## 32. Security Considerations
* Ensure task IDs used for polling are UUIDs and scoped to the user to prevent enumeration.

## 33. Analytics Events
* Track pipeline duration (Time-to-Interactive for the meeting).

## 34. Storybook Stories
* Uploading, Transcribing, Summarizing.

## 35. Figma Mapping
* `AI/ProcessingTracker`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* Standard layout classes.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Upload a 1-hour file and verify the UI doesn't timeout before the backend finishes.

## 40. Acceptance Criteria
* Accurately reflects backend Celery state.

## 41. Future Enhancements
* Estimated Time Remaining calculation based on file size and current worker queue depth.

## 42. CTO Notes
* Do not rely solely on WebSockets; always fall back to short polling if the socket drops.
