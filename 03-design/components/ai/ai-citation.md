---
Title: MeetingMind — Component: AI Citation
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/overlays/hover-card.md
---

# MeetingMind Component: AI Citation

## 1. Overview
An inline interactive marker `[1]` placed within AI-generated text that links the LLM's claim back to a specific timestamp in the raw transcript.

## 2. Design Philosophy
Trust in AI requires verifiability. Citations allow users to instantly audit the LLM's summary by reading (or listening to) the exact quote it based its conclusion on.

## 3. Problem Statement
Users will not trust an AI summary of a critical legal or financial meeting if they cannot verify the source material.

## 4. UX Goals
* Unobtrusive in the reading flow.
* Highly interactive on hover/click.

## 5. Usage Guidelines
* Used within the `AISummary` block.

## 6. When to Use
* Whenever the LLM uses the RAG system to generate a fact.

## 7. When NOT to Use
* On general conversation text not tied to a source.

## 8. Component Anatomy
* Trigger (Inline superscript number `[1]`).
* HoverCard Content (Preview of the transcript snippet).
* Click Action (Scrolls the transcript pane to that exact line).

## 9. Variants
* Default.

## 10. Sizes
* Text is smaller than body text (`text-xs` or `sup`).

## 11. States
* Default, Hovered.

## 12. Layout Rules
* Inline with text.

## 13. Content Guidelines
* The preview should show ~1 sentence before and after the cited text for context.

## 14. Icon Rules
* N/A.

## 15. Color System
* `text-primary`.
* Background on hover: `bg-primary/10`.

## 16. Typography
* `font-medium cursor-pointer align-super text-[0.7em]`.

## 17. Spacing
* Minimal margin `ml-0.5`.

## 18. Motion
* HoverCard fade-in.

## 19. Accessibility
* Should be a `<button>` with an `aria-label` like "View source for claim 1".

## 20. Keyboard Interaction
* Enter to execute the scroll-to-source action.

## 21. Responsive Behavior
* On mobile, clicking opens a Drawer instead of a HoverCard.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<Citation id="cit-1" sourceId="transcript-442" timestamp="14:05">
  [1]
</Citation>
```

## 25. Props Reference
* `id`, `sourceId`, `timestamp`.

## 26. Events
* `onClick` (triggers global state update to scroll the transcript viewer).

## 27. Composition
* Wraps a HoverCard around a Button.

## 28. AI Usage Guidelines
* The LLM must be explicitly prompted to output citations in a parseable format (e.g., `...budget was approved <cite>14:05</cite>`). A frontend parser converts these tags to this component.

## 29. Error Handling
* If the `sourceId` doesn't exist, disable the citation.

## 30. Edge Cases
* Multiple citations clustered together `[1][2][3]`. Ensure they don't break line wrapping awkwardly.

## 31. Performance
* Rendering hundreds of HoverCards can be slow. Consider attaching a single HoverCard to the body and delegating events rather than rendering 100 separate Radix portals.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track citation clicks to measure how often users feel the need to verify AI claims.

## 34. Storybook Stories
* Inline Text Example.

## 35. Figma Mapping
* `AI/Citation`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `inline-flex items-center justify-center rounded-sm px-1 py-0.5 text-[0.7rem] font-bold leading-none text-primary transition-colors hover:bg-primary/20`

## 38. Implementation Notes
* Writing the regex to parse the LLM output and swap in this React component is the hardest part. Use a library like `react-string-replace` or write a custom `remark` plugin for `react-markdown`.

## 39. QA Checklist
* Ensure clicking the citation actually scrolls the transcript view accurately.

## 40. Acceptance Criteria
* Interactive, verifiable sourcing.

## 41. Future Enhancements
* Clicking a citation immediately plays the audio from that timestamp.

## 42. CTO Notes
* The RAG backend must return chunk metadata alongside the generated text to make this feature possible.
