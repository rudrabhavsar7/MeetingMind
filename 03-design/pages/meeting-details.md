---
Title: MeetingMind — Meeting Details Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/layouts.md
---

# MeetingMind — Meeting Details Page (`/meetings/[id]`)

This is the most critical and complex view in MeetingMind. It presents the raw transcript synchronized with the AI-generated intelligence.

## 1. Page Purpose
To allow users to consume the summarized outputs of a meeting while maintaining the ability to verify those outputs against the raw transcript source of truth.

## 2. Layout Structure (Split-Pane)

* **Top Header:** Meeting Title, Date, "Share" button, "Export" dropdown menu.
* **Left Pane (Transcript - 60vw):** 
  * The full textual transcript, segmented by speaker and timestamp.
  * Embedded, sticky Audio/Video player at the top or bottom of this pane.
* **Right Pane (Insights - 40vw):**
  * A sticky sidebar containing Tabbed content:
    * Tab 1: AI Summary (Default)
    * Tab 2: Decisions
    * Tab 3: Action Items

## 3. Interaction Design

### 3.1 Playback Synchronization
* As the audio plays, the active transcript segment in the Left Pane highlights (`bg-muted`).
* Clicking on any timestamp in the transcript seeks the audio player to that exact moment.

### 3.2 Citation Highlighting
* When reading the AI Summary in the Right Pane, hovering over a citation `[1]` causes the corresponding transcript segment in the Left Pane to briefly flash (`bg-primary/20`) and scrolls it into view if it is off-screen.

### 3.3 Text Selection
* Highlighting text in the transcript triggers a floating popover menu with options:
  * "Copy Link to Quote"
  * "Create Manual Action Item"

## 4. Responsive Behavior

* **Desktop (`>= lg`):** The split-pane layout is active. Both panes scroll independently.
* **Mobile (`< lg`):** The split-pane collapses. 
  * The layout becomes a single column.
  * The Header remains.
  * The Insights Tabs (Summary, Decisions, Actions) become the primary navigation for the page.
  * The Transcript becomes a 4th tab.
  * The Audio player becomes a fixed sticky bar at the very bottom of the screen.

## 5. Loading States
* The page structure loads immediately.
* If the meeting is still `PROCESSING`:
  * The Left Pane shows a skeleton transcript.
  * The Right Pane shows a pulsing "AI is analyzing this meeting..." state with a progress indicator.
  * Polling (via React Query `refetchInterval`) checks for completion every 5 seconds.
