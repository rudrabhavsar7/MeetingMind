---
Title: MeetingMind — Component: Progress
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind Component: Progress

## 1. Overview
A deterministic progress bar indicating the completion percentage of a long-running task.

## 2. Design Philosophy
For tasks taking longer than 2 seconds, such as importing a large recording or processing a finalized live capture, a spinner causes anxiety. A progress bar provides reassurance that the system hasn't frozen.

## 3. Problem Statement
Recording imports and AI transcription/analysis are slow operations. Users need precise feedback on status.

## 4. UX Goals
* Clearly communicate how much work is done and how much remains.

## 5. Usage Guidelines
* Use for recording imports to MinIO.
* Use for Celery task progress (e.g., Whisper transcription phases).

## 6. When to Use
* When you know the total amount of work and current status (deterministic).

## 7. When NOT to Use
* For fast API calls (use a Spinner).
* When progress cannot be measured (indeterminate).

## 8. Component Anatomy
* Track (The background).
* Indicator (The filled portion).

## 9. Variants
* **Default:** Horizontal bar.

## 10. Sizes
* `h-2` (Small, subtle)
* `h-4` (Standard, used on recording import and processing views).

## 11. States
* Values from `0` to `100`.

## 12. Layout Rules
* Usually `w-full` of its container.

## 13. Content Guidelines
* Best paired with text describing the phase (e.g., "Uploading: 45%").

## 14. Icon Rules
* N/A.

## 15. Color System
* Track: `bg-secondary`.
* Indicator: `bg-primary`.

## 16. Typography
* N/A.

## 17. Spacing
* Fully rounded (`rounded-full`).

## 18. Motion
* CSS `transition-transform` on the indicator to smoothly slide it to the next percentage value.

## 19. Accessibility
* Must implement `role="progressbar"`.
* Must have `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.

## 20. Keyboard Interaction
* N/A (Read-only).

## 21. Responsive Behavior
* Fluid width.

## 22. Dark Mode
* Handled by semantic color tokens.

## 23. Design Tokens
* `--primary`, `--secondary`.

## 24. API Specification
Built using Radix UI `Progress`.

```tsx
<Progress value={33} />
```

## 25. Props Reference
* `value`: Number (0-100).
* `className`: String.

## 26. Events
* N/A.

## 27. Composition
* Used on the `/meetings/import` fallback page and meeting processing states.

## 28. AI Usage Guidelines
* Use to track multi-stage LLM pipelines (e.g., 33%: Transcribing, 66%: Extracting Actions, 100%: Summarizing).

## 29. Error Handling
* If a task fails, the indicator could turn `--destructive` (red), but typically it's just removed and replaced by an error message.

## 30. Edge Cases
* Value over 100 or under 0 should clamp.

## 31. Performance
* Transition transforms are hardware-accelerated.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* 0%, 50%, 100%.

## 35. Figma Mapping
* `Core/Progress`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add progress`

## 37. Tailwind Mapping
* `relative h-4 w-full overflow-hidden rounded-full bg-secondary`

## 38. Implementation Notes
* Radix UI handles the `translateX` math under the hood to ensure the bar fills correctly based on the `value` prop.

## 39. QA Checklist
* Ensure the bar doesn't jump backwards.

## 40. Acceptance Criteria
* Smoothly animates to target percentage.

## 41. Future Enhancements
* Adding an estimated time remaining calculation below the bar.

## 42. CTO Notes
* Wire this directly to the import upload progress event on the frontend for smooth, realistic feedback during fallback file ingestion.
