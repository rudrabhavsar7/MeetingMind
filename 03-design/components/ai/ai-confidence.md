---
Title: MeetingMind — Component: AI Confidence
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-11
Dependencies: 03-design/components/foundation/badge.md
---

# MeetingMind Component: AI Confidence

## 1. Overview
A visual indicator for a calibrated/heuristic confidence score returned for an entire transcript segment, Action Item, or Decision. v1 does not present an LLM's uncalibrated self-reported certainty or per-word summary confidence as fact.

## 2. Design Philosophy
Transparency builds trust. If the AI is unsure about a name, a date, or a complex technical term in a transcript, it should visually flag it for human review.

## 3. Problem Statement
LLMs hallucinate confidently. Users might blindly trust a summary that contains a critical error (e.g., "Invoice is $50,000" instead of "$15,000" due to poor audio quality).

## 4. UX Goals
* Highlight potentially inaccurate information.
* Prompt the user to verify against the source.

## 5. Usage Guidelines
* Attach to a whole transcript segment, Action Item, or Decision only when the backend returns a documented score.
* Always pair uncertainty with source citations so users can verify the evidence.

## 6. When to Use
* When a non-null confidence score returned by the backend is < 80%.

## 7. When NOT to Use
* For high-confidence (95%+) data. Too many green "High Confidence" badges create visual noise. Only flag the low-confidence ones.

## 8. Component Anatomy
* Dot Indicator or Badge.
* Tooltip explaining the score.

## 9. Variants
* **Low (Red/Amber):** Requires review.
* **Medium (Yellow):** Might be inaccurate.

## 10. Sizes
* Tiny (inline with text).

## 11. States
* Static.

## 12. Layout Rules
* Usually appears next to an Action Item, Decision, or transcript segment. Per-word dotted underlines are deferred.

## 13. Content Guidelines
* Tooltip should say "AI is unsure about this information. Please review the transcript."

## 14. Icon Rules
* N/A.

## 15. Color System
* Low: `--destructive` (Red) or `--warning` (Amber).

## 16. Typography
* N/A.

## 17. Spacing
* N/A.

## 18. Motion
* None.

## 19. Accessibility
* Add screen reader text `<span className="sr-only">Low confidence</span>`.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* N/A.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--destructive`, `--warning`.

## 24. API Specification
```tsx
<ConfidenceIndicator score={0.65}>
  <span className="decoration-dashed underline decoration-warning decoration-2 underline-offset-4 cursor-help">
    $50,000
  </span>
</ConfidenceIndicator>
```

## 25. Props Reference
* `score`: Float between 0.0 and 1.0.

## 26. Events
* N/A.

## 27. Composition
* Uses Tooltip.

## 28. AI Usage Guidelines
* A missing score renders no confidence badge. Citations and human review remain the primary trust mechanism.
* v1 scores may come from STT confidence or a documented extraction heuristic; do not label raw LLM logprobs as calibrated confidence.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Text Highlight.

## 35. Figma Mapping
* `AI/Confidence`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `underline decoration-dashed decoration-warning`

## 38. Implementation Notes
* Consume the nullable entity-level `confidence_score` from the typed API contract. Never inject custom unsanitized model tags into Markdown.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Visually distinct from standard text, provides tooltip context.

## 41. Future Enhancements
* Allow user to click the word and type a manual correction.

## 42. CTO Notes
* Per-word confidence and calibrated summary-claim confidence require a future evaluation-backed contract.
