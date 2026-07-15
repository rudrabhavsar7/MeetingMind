---
Title: MeetingMind — Component: AI Chat Message
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/avatar.md
---

# MeetingMind Component: AI Chat Message

## 1. Overview
A chat bubble component used for displaying a back-and-forth dialogue between the User and the AI.

## 2. Design Philosophy
Conversational interfaces need clear distinction between actors. The User's messages should look distinct from the AI's responses.

## 3. Problem Statement
Raw text streams look like a single block of text, making it hard to parse who asked what.

## 4. UX Goals
* Clearly separate User and AI turns.
* Support Markdown in AI responses.

## 5. Usage Guidelines
* Used on the "Ask AI" dedicated page, where users can have follow-up conversations.

## 6. When to Use
* Multi-turn RAG chat interfaces.

## 7. When NOT to Use
* For single-shot summaries (Use `AISummaryBlock`).

## 8. Component Anatomy
* Container (Flex row).
* Avatar (User profile pic or AI Sparkles icon).
* Message Bubble (Contains text/markdown).
* Footer (Timestamps or feedback buttons).

## 9. Variants
* **User Message:** Right-aligned (usually), distinct background color (e.g., `--primary/10`).
* **AI Message:** Left-aligned, neutral background, includes Markdown rendering.

## 10. Sizes
* `w-full` container, `max-w-[80%]` for the bubble.

## 11. States
* Streaming (AI message only).

## 12. Layout Rules
* Standard chat app layout (flex box with `justify-end` or `justify-start`).

## 13. Content Guidelines
* AI text must handle Markdown tables and lists smoothly.

## 14. Icon Rules
* AI uses the `Sparkles` icon inside a solid primary-colored `Avatar`.

## 15. Color System
* User Bubble: `bg-muted` or `bg-primary/10`.
* AI Bubble: `bg-transparent` (often AI messages don't have a bubble, just text next to an avatar to give it more room for formatting).

## 16. Typography
* Body text: `text-sm`.

## 17. Spacing
* Message gap: `gap-4`.

## 18. Motion
* New messages slide up slightly when appended.

## 19. Accessibility
* Ensure contrast inside colored bubbles.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Bubbles take up more width percentage on mobile.

## 22. Dark Mode
* Adjust backgrounds to ensure text remains legible.

## 23. Design Tokens
* `--primary`, `--muted`.

## 24. API Specification
```tsx
<ChatMessage role="user">
  <Avatar><AvatarFallback>ME</AvatarFallback></Avatar>
  <div className="bg-muted p-3 rounded-lg text-sm">
    What were the key takeaways?
  </div>
</ChatMessage>
```

## 25. Props Reference
* `role`: "user" | "ai" | "system".
* `content`: String.

## 26. Events
* N/A.

## 27. Composition
* Uses Avatar, Markdown renderer.

## 28. AI Usage Guidelines
* This is the core display component for multi-turn chat.

## 29. Error Handling
* If a message fails to send, render the User message with a red `AlertCircle` and a "Retry" button.

## 30. Edge Cases
* Code blocks in AI responses must overflow horizontally with a scrollbar, not break the bubble layout.

## 31. Performance
* Use React `memo` on older messages so they don't re-render while the newest message is streaming in.

## 32. Security Considerations
* Markdown sanitization is mandatory.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* User Message, AI Message.

## 35. Figma Mapping
* `AI/ChatMessage`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `flex gap-4 p-4`

## 38. Implementation Notes
* Use the project's typed SSE client and TanStack Query conventions. Do not add a provider-specific SDK merely for stream state.

## 39. QA Checklist
* Test long contiguous strings to ensure word-wrap works.

## 40. Acceptance Criteria
* Visually distinct chat roles.

## 41. Future Enhancements
* "Regenerate response" button on AI messages.

## 42. CTO Notes
* N/A.
