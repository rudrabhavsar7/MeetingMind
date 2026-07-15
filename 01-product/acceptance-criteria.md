---
Title: MeetingMind — Acceptance Criteria
Version: 1.1.0
Status: Approved
Owner: Quality Assurance Lead
Last Updated: 2026-07-10
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
* **Scenario: First-run bootstrap**
  * Given the deployment contains zero users
  * When the operator submits valid Owner and workspace details
  * Then exactly one user, one workspace, and one Owner membership are committed
  * And a concurrent second bootstrap request cannot create another workspace.

* **Scenario: Registration closes after bootstrap**
  * Given the deployment already has an Owner
  * When an unauthenticated visitor submits registration without an invitation
  * Then the API returns a generic registration-closed error
  * And no user or workspace is created.

* **Scenario: Invited user registers**
  * Given an Owner or Admin issued a valid invitation
  * When the invited email submits the invitation token and a valid password
  * Then the account is attached to the default workspace with the invitation's role
  * And the invitation cannot be reused.

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

* **Scenario: Password reset privacy**
  * Given a visitor submits the forgot-password form
  * When the email is existing or unknown
  * Then both requests receive the same generic success response
  * And any issued reset token is single-use and expires.

* **Scenario: v1 workspace boundary**
  * Given any authenticated v1 user
  * When they load their available workspaces
  * Then at most the deployment's one default workspace is returned
  * And the UI does not offer workspace creation or switching.

### 2.2 Extension-Based Real-Time Meeting Capture
* **Scenario: Start Google Meet Capture**
  * Given the user has installed and connected the MeetingMind Chrome extension
  * And they are inside an active Google Meet tab
  * When they click "Start Capture" in the extension and grant tab audio permission
  * Then a meeting record is created in the deployment's default workspace
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

* **Scenario: Standalone Web Capture Fallback**
  * Given the user opens `/meetings/new` in a supported browser
  * When they explicitly grant microphone permission and start capture
  * Then a `standalone_web_capture` meeting uses the same acknowledged live protocol
  * And the UI states that microphone audio—not meeting-tab audio or page metadata—is being captured.

### 2.3 Meeting Details & Transcript
* **Scenario: Viewing a processed meeting**
  * Given a meeting has finished processing
  * When the user navigates to `/meetings/{id}`
  * Then the AI Summary tab is active by default
  * And the current summary contains key points and at least one clickable source citation
  * And regenerating the summary creates a new version without deleting the previous version or its citations.

* **Scenario: Transcript Navigation**
  * Given the user is viewing the Transcript tab
  * And retained or imported media is available and permitted
  * When they click on the timestamp `14:22` next to a speaker's text
  * Then the embedded audio player jumps to `14:22` and begins playing.

* **Scenario: Transcript Without Retained Media**
  * Given raw audio retention was disabled and no imported media exists
  * When the user views the Transcript tab
  * Then transcript timestamps and citations remain usable
  * And the UI explains that playback is unavailable rather than showing a broken player.

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

* **Scenario: Workspace Keyword Search**
  * Given the workspace has meeting titles and final transcript segments
  * When the user submits a keyword phrase in keyword-search mode
  * Then ranked title/segment snippets from only that workspace are returned without invoking an LLM
  * And each transcript result links to its exact meeting timestamp.

### 2.5 Action Items
* **Scenario: Marking Task Complete**
  * Given the user has an open Action Item assigned to them
  * When they click the checkbox next to the item
  * Then the item gets a strikethrough styling
  * And an API call is made to update the status to "completed"
  * And the item is removed from the "Open Tasks" view on page refresh.

* **Scenario: Global Action Tracker**
  * Given the workspace contains action items from multiple meetings
  * When the user filters `/actions` by status, assignee, or meeting
  * Then only matching items in the active workspace appear
  * And a Viewer can follow citations but cannot edit items.

### 2.6 Profile Management
* **Scenario: Change Password**
  * Given an authenticated user enters the correct current password and a valid new password
  * When they submit the security form
  * Then the password changes, other refresh/extension sessions are revoked, and a security audit event is recorded.

### 2.7 Export
* **Scenario: Export to Markdown**
  * Given the user is viewing a meeting
  * When they click "Export" -> "Markdown"
  * Then the browser downloads a `.md` file
  * And the file contains the Meeting Title, Date, current cited Summary, Actions, Decisions, and timestamped Transcript
  * And it contains no internal object keys, signed URLs, secrets, or hidden prior versions.
