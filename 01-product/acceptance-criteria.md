---
Title: MeetingMind — Acceptance Criteria
Version: 1.0.0
Status: Approved
Owner: Quality Assurance Lead
Last Updated: 2026-06-28
Dependencies: 01-product/functional-requirements.md
---

# MeetingMind — Acceptance Criteria

This document translates the functional requirements into specific, testable behaviors. These criteria act as the Definition of Done (DoD) for feature development.

## 1. Definition of Done (DoD)
Before a feature can be merged to the `main` branch, it must meet the following criteria:
1. Code passes all linting (`ruff`, `eslint`) and type-checking (`mypy`, `tsc`).
2. Unit tests are written and pass (coverage > 80%).
3. The feature satisfies all specific Acceptance Criteria listed below.
4. E2E tests (Playwright) pass for core user journeys.
5. Code has been reviewed and approved by at least one other engineer.

---

## 2. Feature Acceptance Criteria

### 2.1 Authentication
* **Scenario: Successful Login**
  * Given the user is on `/login`
  * When they enter a valid email and password and click "Sign In"
  * Then they are redirected to `/dashboard`
  * And an access token is stored in memory
  * And a refresh token is stored in an HTTP-only cookie.

* **Scenario: Invalid Login**
  * Given the user is on `/login`
  * When they enter an incorrect password
  * Then a toast notification says "Invalid credentials"
  * And the password field is cleared.

### 2.2 Extension-Based Real-Time Meeting Capture
* **Scenario: Start Google Meet Capture**
  * Given the user has installed and connected the MeetingMind Chrome extension
  * And they are inside an active Google Meet tab
  * When they click "Start Capture" in the extension and grant tab audio permission
  * Then a meeting record is created in the selected workspace
  * And the extension transitions to a "Recording" state within 2 seconds.

* **Scenario: Live Transcript Appears**
  * Given an extension capture session is active
  * When the user speaks for at least 5 seconds
  * Then interim transcript text appears in the extension side panel
  * And final speaker-labeled transcript segments are persisted after pauses.

* **Scenario: Meeting Context Saved**
  * Given the extension is capturing a Google Meet session
  * When the meeting page exposes title, URL, and visible participants
  * Then MeetingMind saves the source app, meeting URL, title, start time, and visible participant names to the meeting details.

* **Scenario: Recording Import Fallback**
  * Given the user is on `/meetings/import`
  * When they drag a `.exe` file into the drop zone
  * Then the drop zone rejects the file immediately
  * And a red toast appears saying "Invalid file format. Please import MP3, MP4, WAV, M4A, or WebM."

### 2.3 Meeting Details & Transcript
* **Scenario: Viewing a processed meeting**
  * Given a meeting has finished processing
  * When the user navigates to `/meetings/{id}`
  * Then the AI Summary tab is active by default
  * And the summary contains bullet points.

* **Scenario: Transcript Navigation**
  * Given the user is viewing the Transcript tab
  * When they click on the timestamp `14:22` next to a speaker's text
  * Then the embedded audio player jumps to `14:22` and begins playing.

### 2.4 AI Search (RAG)
* **Scenario: Successful Semantic Query**
  * Given the workspace has processed meetings
  * When the user enters "What is our Q3 marketing budget?" in the Search page
  * Then a skeleton loader appears
  * And within 5 seconds, an AI generated answer streams onto the screen
  * And the answer contains at least one clickable citation `[1]`.

* **Scenario: Clicking a Citation**
  * Given an AI generated search result with a citation `[1]`
  * When the user clicks `[1]`
  * Then a modal (or new tab) opens showing the exact transcript segment from the source meeting.

### 2.5 Action Items
* **Scenario: Marking Task Complete**
  * Given the user has an open Action Item assigned to them
  * When they click the checkbox next to the item
  * Then the item gets a strikethrough styling
  * And an API call is made to update the status to "closed"
  * And the item is removed from the "Open Tasks" view on page refresh.

### 2.6 Export
* **Scenario: Export to Markdown**
  * Given the user is viewing a meeting
  * When they click "Export" -> "Markdown"
  * Then the browser downloads a `.md` file
  * And the file contains the Meeting Title, Date, AI Summary, and Decisions.
