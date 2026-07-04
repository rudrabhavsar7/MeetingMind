---
Title: MeetingMind — Experience Tokens
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-system.md
---

# MeetingMind — Experience Tokens

While Design Tokens dictate *how things look* (colors, spacing), Experience Tokens define *how the application feels*. These dictate pacing, feedback, and structural continuity across MeetingMind.

## 1. Perceived Performance

Because AI processing (transcription, RAG) takes time, we use experience tokens to manage user patience.

### 1.1 Optimistic Updates
* **Rule:** If a user action has a >95% chance of success (e.g., checking off an Action Item, renaming a Meeting), the UI MUST update instantly before the server responds.
* **Fallback:** If the server request fails, revert the UI state and show an error Toast.

### 1.2 Skeleton Loading
* **Rule:** Never show a blank screen or a full-page spinner while fetching data.
* **Token:** Use a pulsating skeleton (`animate-pulse bg-muted`) that mimics the structure of the data about to load (e.g., 3 skeleton cards for a meeting list, a block of skeleton text for a transcript).

### 1.3 Progressive Disclosure
* **Rule:** Do not overwhelm the user with raw data.
* **Token:** AI Summaries are shown first. Transcripts require clicking a tab. Within the transcript, speakers with back-to-back segments are visually merged to reduce clutter.

## 2. Feedback Mechanisms

### 2.1 Transient Feedback (Toasts)
* **Usage:** For success messages ("Meeting captured"), non-critical errors ("Failed to copy link"), or background task completions ("Transcription finished").
* **Duration:** 4000ms.
* **Position:** Bottom-right of the screen.

### 2.2 Blocking Feedback (Dialogs)
* **Usage:** For destructive actions that cannot be undone (e.g., "Delete Workspace").
* **Token:** Requires explicit user confirmation (e.g., typing the workspace name to confirm deletion).

### 2.3 Inline Feedback (Validation)
* **Usage:** For form errors.
* **Token:** Red border (`border-destructive`) around the input, accompanied by a red text message directly below it (`text-destructive text-sm`).

## 3. Trust & AI Transparency

A core pillar of MeetingMind's experience is trusting the AI output.

### 3.1 Citations
* **Rule:** Every AI-generated claim in a RAG search result or Summary must include a citation.
* **Token:** Citations are rendered as small superscript links (e.g., `[1]`) that, when hovered, show the exact transcript snippet, and when clicked, jump the media player to that exact timestamp.

### 3.2 Confidence Scores
* **Rule:** If the Whisper model has low confidence in a transcribed segment, or the LLM has low confidence in an extracted action item, it must be visually flagged.
* **Token:** A small orange underline or a "Review Needed" badge (`bg-orange-100 text-orange-800`).

## 4. Continuity

* **Rule:** The layout should not violently shift when navigating between main views.
* **Token:** The Sidebar and Topbar remain static. Only the main `<main>` content area re-renders. Use Framer Motion for subtle fade-throughs (`opacity: 0 -> 1`) when switching major routes to soften the transition.
