---
Title: MeetingMind - Extension Capture Experience
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-10
Dependencies: 01-product/prd.md, 01-product/functional-requirements.md
Related Documents:
  - 03-design/design-system.md
  - 03-design/pages/meeting-details.md
---

# MeetingMind - Extension Capture Experience

The Chrome extension is the primary v1 capture surface. It lets users capture meetings inside the tools they already use, starting with Google Meet.

v1 requires Chrome 116+ and follows `04-backend/realtime-protocol.md`. The popup/side panel is UI only; a Manifest V3 offscreen document owns the audio stream and WebSocket so capture survives popup closure and service-worker suspension.

## 1. Surfaces

* **Extension Popup:** Connection status, read-only default workspace, Start/Stop Capture, link to console. Workspace switching is deferred to v1.2.
* **Extension Side Panel:** Recording status, live transcript, rolling summary, detected action items, detected decisions.
* **MeetingMind Console:** Full meeting details, transcript, summary, actions, decisions, source metadata, search, and exports.

## 2. Core States

* **Disconnected:** User must connect the extension to MeetingMind.
* **No Meeting Detected:** User is not on a supported meeting page.
* **Detected:** Supported meeting page found; user can start capture.
* **Permission Required:** Browser tab audio permission is needed.
* **Recording:** Audio is streaming and transcript events are arriving.
* **Reconnecting:** WebSocket dropped and the extension is retrying.
* **Paused:** Session and heartbeat remain connected, but no audio is captured or transmitted.
* **Transcript Gap:** More audio was lost than the bounded replay buffer could recover; show the missing time range and keep it visible in meeting details.
* **Completed:** Capture ended and final processing is running or complete.
* **Failed:** Capture cannot continue; user sees retry/export diagnostic options.

## 3. Capture Controls

* Start Capture
* Pause/Resume
* Stop Capture
* Open in Console
* Copy Meeting Link

Controls must be compact, keyboard reachable, and safe against accidental stop. Stop should require confirmation once a recording has more than 60 seconds of captured audio.

Pause/Resume must not create a new meeting. Stop flushes acknowledged audio for up to five seconds, then calls the idempotent end endpoint. Reconnect may request a fresh handshake token without asking the user to restart capture.

## 4. Metadata

The extension should save whatever is available without scraping private data aggressively:

* source app: Google Meet, Zoom Web, Teams Web
* source URL
* page title or visible meeting title
* start/end time
* visible participant names, when exposed in the DOM

If metadata is unavailable, the console must allow users to edit the meeting title and participants after capture.

## 5. Privacy UX

The extension must make capture state obvious:

* Show a persistent recording indicator while streaming.
* Never auto-start capture.
* Require explicit user action before audio capture.
* Explain whether raw audio retention is enabled for the workspace.
* Keep meeting audio audible to the user while tab capture is active.
* If a reconnect exceeds the 60-second in-memory replay window, disclose the transcript gap instead of implying complete capture.
