---
Title: MeetingMind — Accessibility Guidelines
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-system.md
---

# MeetingMind — Accessibility (a11y) Guidelines

MeetingMind is committed to providing an inclusive experience. All interfaces must adhere to **WCAG 2.2 Level AA** standards. Because MeetingMind is an enterprise tool, accessibility is a hard requirement for compliance in many organizations.

## 1. Keyboard Navigation

The entire application must be usable without a mouse.

* **Focus States:** Every interactive element (links, buttons, inputs) MUST have a clearly visible `:focus-visible` state. We use Tailwind's `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
* **Tab Order:** The logical DOM order must match the visual layout. Avoid using `tabindex` greater than `0`.
* **Skip Links:** A "Skip to main content" link must be available for keyboard users to bypass the sidebar navigation.
* **Modals & Dialogs:** Focus must be trapped inside an open modal. When the modal closes, focus must return to the element that triggered it (handled automatically by Radix UI).

## 2. Screen Readers & Semantics

* **Semantic HTML:** Use native elements (`<nav>`, `<main>`, `<article>`, `<aside>`, `<h1>` to `<h6>`) appropriately.
* **ARIA Attributes:** Use ARIA only when native HTML is insufficient. Radix UI handles complex ARIA patterns for tabs, accordions, and dialogs.
* **Icon Buttons:** Any button containing only an icon MUST have a screen-reader-only label or `aria-label`.
  ```tsx
  <Button size="icon" variant="ghost">
    <TrashIcon className="h-4 w-4" />
    <span className="sr-only">Delete meeting</span>
  </Button>
  ```
* **Dynamic Content:** AI summaries and search results streaming in must be announced. Use `aria-live="polite"` for non-interruptive updates and `aria-live="assertive"` for critical errors.

## 3. Color & Contrast

* **Contrast Ratio:** Text and interactive elements must have a contrast ratio of at least **4.5:1** against their background (3:1 for large text).
* **Color Independence:** Information cannot be conveyed by color alone.
  * *Example:* An error state shouldn't just turn a border red; it must also display a text error message or an error icon.
* **Theme Testing:** Contrast must be verified in both Light and Dark modes.

## 4. Transcript Accessibility Specifics

Transcripts present unique accessibility challenges due to their density and temporal nature.

* **Speaker Identification:** Speaker names must be announced clearly by screen readers before their dialogue.
* **Timestamps:** Timestamps (e.g., `14:22`) must be legible and properly labeled so screen readers don't read them confusingly.
* **Audio Sync:** When clicking a transcript segment to play the corresponding audio, focus should ideally remain on the text being read, or clearly indicate the active playing segment visually and semantically.

## 5. Animation & Motion

* **Prefers Reduced Motion:** Users who have enabled "Reduce Motion" in their OS settings must not see jarring animations.
* Implement this using Tailwind's `motion-reduce:` variants or Framer Motion's `useReducedMotion` hook.
  ```css
  .animate-slide-up {
    @apply transition-transform duration-300;
  }
  @media (prefers-reduced-motion: reduce) {
    .animate-slide-up {
      @apply transition-none transform-none;
    }
  }
  ```

## 6. Testing a11y

* **Automated:** Run `eslint-plugin-jsx-a11y` in CI. Run `axe-core` via Playwright in E2E tests.
* **Manual:** Developers must test all new features using Keyboard-only navigation and VoiceOver (Mac) or NVDA (Windows) before opening a PR.
