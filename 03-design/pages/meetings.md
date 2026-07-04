---
Title: MeetingMind — Meetings Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 01-product/information-architecture.md
---

# MeetingMind — Meetings Page (`/meetings`)

The Meetings page acts as the central repository and library for all processed intelligence in the workspace.

## 1. Page Purpose
To allow users to browse, filter, and find past meetings efficiently without needing to use the global RAG search.

## 2. Layout Structure

* **Header:** Title "All Meetings".
* **Filter Bar (Sticky):**
  * Search input (Keyword search on titles/participants).
  * Date range picker.
  * Captured/imported by dropdown (Filter by who created the meeting record).
  * Status toggle (Complete / Processing / Failed).
* **Grid Area:**
  * A responsive CSS Grid displaying `MeetingCard` components.
* **Footer:**
  * Pagination controls or an infinite scroll "Load More" trigger.

## 3. Component Breakdown

### 3.1 Filter Bar
* The filter bar drives URL state (`?search=foo&date=last_30_days`). This ensures the view is shareable and survives a page refresh.
* Uses shadcn/ui `Select`, `Input`, and `Popover` + `Calendar` for the date picker.

### 3.2 The Meeting Card
The atomic unit of this page.
* **Visuals:** A clean, bordered card (`bg-card`).
* **Header:** Title of the meeting.
* **Metadata:** Date, Duration (e.g., `45m`), source app/import label, creator avatar.
* **Body:** The first two sentences of the AI Executive Summary, truncated with `line-clamp-2`.
* **Footer:** Badge indicating status (e.g., `Processed` in Emerald, or `Processing` with a spinner).

## 4. Responsive Behavior

* **Mobile (`< md`):** 1 column grid. Filters collapse into a single "Filters" button that opens a bottom sheet (`Drawer`).
* **Tablet (`md`):** 2 column grid.
* **Desktop (`lg`):** 3 column grid.
* **Ultrawide (`xl`):** 4 column grid.

## 5. Edge Cases
* **Failed Processing:** If a meeting failed to process (e.g., Whisper crashed), the card displays a red "Failed" badge and an explicit "Retry Processing" button for Admins.
* **Empty State (Filtered):** "No meetings match your filters. [Clear filters]"
