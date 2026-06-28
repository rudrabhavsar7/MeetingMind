---
Title: MeetingMind — Component: AI Confidence
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/badge.md
---

# MeetingMind Component: AI Confidence

## 1. Overview
A visual indicator (usually a badge or a color-coded dot) that communicates the LLM's self-reported certainty regarding a specific claim or extracted action item.

## 2. Design Philosophy
Transparency builds trust. If the AI is unsure about a name, a date, or a complex technical term in a transcript, it should visually flag it for human review.

## 3. Problem Statement
LLMs hallucinate confidently. Users might blindly trust a summary that contains a critical error (e.g., "Invoice is $50,000" instead of "$15,000" due to poor audio quality).

## 4. UX Goals
* Highlight potentially inaccurate information.
* Prompt the user to verify against the source.

## 5. Usage Guidelines
* Attach to specific extracted entities (Names, Numbers, Dates).
* Attach to Action Items.

## 6. When to Use
* When confidence score returned by the backend is < 80%.

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
* Usually floats next to an Action Item or is rendered as a dotted underline beneath a specific word.

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
* The backend must support returning token logprobs or structured confidence scores. (Ollama can return logprobs, but structuring it into the UI requires careful parsing).

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
* Easiest implementation: The backend highlights low-confidence words by wrapping them in a custom markdown tag `<lowconf>word</lowconf>`, which the frontend ReactMarkdown parses into this component.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Visually distinct from standard text, provides tooltip context.

## 41. Future Enhancements
* Allow user to click the word and type a manual correction.

## 42. CTO Notes
* Extracting confidence per-word from an LLM API requires specific backend configuration (returning logprobs) and complex chunk mapping. For v1, you might restrict this to just attaching a single confidence score to whole Action Items rather than per-word inline highlights.
