---
Title: MeetingMind — Component: AI Search Input
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/forms/textarea.md
---

# MeetingMind Component: AI Search Input

## 1. Overview
The primary interface for interacting with the RAG (Retrieval-Augmented Generation) system. A combination of a prompt text area, attachment indicators, and a submit button.

## 2. Design Philosophy
Must feel powerful yet simple, akin to ChatGPT or Perplexity search bars. It's not just a standard input; it's the gateway to the app's core value.

## 3. Problem Statement
Standard inputs don't allow multi-line queries (shift+enter), and don't visually support context chips (e.g., "Search in: Last Meeting").

## 4. UX Goals
* Encourage long, detailed natural language queries.
* Indicate clearly when the AI is processing.

## 5. Usage Guidelines
* Placed prominently on the "Ask AI" / Search page.

## 6. When to Use
* For the main RAG query interface.

## 7. When NOT to Use
* For basic database filtering (Use standard Inputs/Selects).

## 8. Component Anatomy
* Container (Rounded box with shadow).
* Auto-resizing Textarea (Grows as the user types).
* Context Chips (e.g., specific meetings selected for the context window).
* Submit Button (Arrow or Send icon).

## 9. Variants
* **Empty:** Waiting for input.
* **Focused:** Glow/Ring effect.
* **Processing:** Submit button becomes a stop button; a glowing animation may appear on the container edge.

## 10. Sizes
* `w-full max-w-3xl`. Min-height ~60px, auto-expands.

## 11. States
* Processing (Submitting).

## 12. Layout Rules
* Usually pinned to the bottom of the screen (like a chat app) or centered on a blank page (like Google Search).

## 13. Content Guidelines
* Placeholder: "Ask anything about your meetings... (e.g., 'What did marketing decide on Q3 budget?')"

## 14. Icon Rules
* Use a `Sparkles` icon to denote AI.
* Use a `CornerDownLeft` or `Send` icon on the submit button.

## 15. Color System
* Border: `border-input focus-within:ring-2 focus-within:ring-primary`.
* Background: `bg-background`.

## 16. Typography
* `text-base` (Prevents iOS zoom, highly readable).

## 17. Spacing
* Padding `p-4`.

## 18. Motion
* Smooth vertical expansion.

## 19. Accessibility
* `aria-label="Ask AI"`.

## 20. Keyboard Interaction
* `Enter` submits the prompt.
* `Shift+Enter` creates a new line.

## 21. Responsive Behavior
* Stays full width on mobile, pinning above the keyboard if possible.

## 22. Dark Mode
* Standard token adjustment.

## 23. Design Tokens
* `--input`, `--primary`.

## 24. API Specification
Custom composition.

```tsx
<div className="relative flex w-full flex-col rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary">
  {/* Context chips can go here */}
  <TextareaAutosize 
    className="min-h-[60px] w-full resize-none bg-transparent p-4 focus:outline-none"
    placeholder="Ask anything..."
  />
  <div className="absolute bottom-3 right-3">
    <Button size="icon" className="rounded-full">
      <ArrowUp />
    </Button>
  </div>
</div>
```

## 25. Props Reference
* `onSubmit`, `isLoading`, `placeholder`.

## 26. Events
* `onSubmit`.

## 27. Composition
* Uses `react-textarea-autosize`, `Button`.

## 28. AI Usage Guidelines
* This *is* the AI component.

## 29. Error Handling
* If request fails, keep the prompt in the textarea so the user doesn't lose their typing.

## 30. Edge Cases
* Extremely long prompts (limit max-height to e.g., 200px and allow internal scrolling).

## 31. Performance
* Use controlled state carefully to avoid re-rendering the whole page on every keystroke.

## 32. Security Considerations
* Prompts will be sent to the LLM; ensure no PII leaks if using external models (though MeetingMind defaults to local Ollama).

## 33. Analytics Events
* Track search volume and empty-result rates.

## 34. Storybook Stories
* Default, Processing.

## 35. Figma Mapping
* `AI/SearchInput`

## 36. shadcn/ui Mapping
* N/A (Custom).

## 37. Tailwind Mapping
* See API Specification for classes.

## 38. Implementation Notes
* Install `react-textarea-autosize`. It is vastly superior to trying to build auto-resizing textareas manually.

## 39. QA Checklist
* Verify `Enter` submits and `Shift+Enter` adds a newline.

## 40. Acceptance Criteria
* Looks and feels like a modern AI prompt interface.

## 41. Future Enhancements
* Voice dictation input (Whisper integration on the frontend).

## 42. CTO Notes
* Handle the `isLoading` state gracefully by swapping the Send button to a Stop button that can abort the AbortController of the fetch request.
