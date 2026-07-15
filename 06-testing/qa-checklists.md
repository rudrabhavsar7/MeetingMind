---
Title: MeetingMind — Testing: QA Checklists
Version: 1.2.0
Status: Approved
Owner: Lead QA Engineer
Last Updated: 2026-07-11
Dependencies: 01-product/requirements-traceability.md
---

# MeetingMind Testing: QA Checklists

## 1. Overview
Automated tests catch regressions, but human QA catches poor user experiences. This document outlines the manual checklists that must be completed before a major release.

## 2. The "New Meeting" Flow
- [ ] Connect the Chrome extension to a workspace. Verify the extension shows the authenticated workspace state.
- [ ] Open a Google Meet tab. Verify the extension detects the meeting and shows a capture-ready state.
- [ ] Start capture with tab-audio permission. Verify a live meeting appears in the console and transcript status updates over WebSocket.
- [ ] Close the popup/side panel and wait for a service-worker restart. Verify the offscreen owner continues capture and tab audio remains audible.
- [ ] Pause for 30 seconds and resume. Verify no audio is sent while paused, the same meeting continues, and timestamps preserve the intentional gap.
- [ ] Keep a test session active beyond 15 minutes, disconnect the network briefly, and verify reconnect uses a fresh handshake token without creating a second meeting.
- [ ] Stop capture. Verify the meeting finalizes into the Meeting Details view without requiring a manual page refresh.
- [ ] Import a 5-minute MP4 fallback recording. Verify progress appears and the batch pipeline succeeds.
- [ ] Attempt to import a PDF. Verify it is rejected with a clear error message.
- [ ] Open `/meetings/new`, grant microphone permission, and capture a short standalone session. Verify it uses the same live protocol but does not claim tab-audio or meeting-page metadata capture.
- [ ] Deny standalone microphone permission and remove the active device. Verify clear recovery/error states and no orphaned recording session.

## 3. The Transcript & AI Quality Check
- [ ] Open a completed meeting. Verify the transcript exists.
- [ ] Click a `SpeakerChip` and rename "SPEAKER_01" to "Alex". Verify the name updates everywhere in the transcript.
- [ ] Read the AI Summary. Does it accurately reflect the captured or imported meeting?
- [ ] Open each summary/action/decision citation. Verify it resolves to exact source text in the same meeting.
- [ ] Regenerate the summary. Verify a new version becomes current only after cited output completes and the previous version remains in history.
- [ ] Check the Action Items tab. Check off an item. Refresh the page. Verify it remains checked (persisted to DB).
- [ ] Click a `Citation [1]`. Verify the page scrolls smoothly to the exact transcript line.

## 4. The RAG Search Check
- [ ] Run a keyword search for a known title/transcript phrase. Verify ranked snippets and timestamp links appear without an AI answer.
- [ ] Verify the UI clearly distinguishes keyword results from Ask AI.
- [ ] Navigate to "Ask AI".
- [ ] Ask a question whose answer is known to be in the transcript (e.g., "What was the budget?").
- [ ] Verify the AI answers correctly and provides a citation.
- [ ] Ask a question completely unrelated to the meeting (e.g., "What is the capital of France?").
- [ ] Verify the AI refuses to answer, stating it relies only on meeting context (tests prompt boundaries).

## 5. Actions, Profile, and Export
- [ ] Open the global Actions page. Filter by status, assignee, and meeting; verify results remain in the active workspace.
- [ ] As Member, edit/complete an action and verify both Actions and meeting detail update. As Viewer, verify controls are read-only.
- [ ] Update the current user's display name and verify another user's profile cannot be targeted.
- [ ] Change password with the correct current password. Verify other browser/extension sessions are revoked; weak/wrong-password attempts do not change sessions.
- [ ] Export a completed meeting to Markdown. Verify Unicode, citations, actions, decisions, and timestamped transcript; verify no object key, signed URL, secret, or hidden prior version appears.

## 6. Responsive & Cross-Browser Check
- [ ] Open the Dashboard in Chrome (Desktop).
- [ ] Open the Dashboard in Safari (macOS).
- [ ] Open the Dashboard in Firefox.
- [ ] Open the Dashboard on an iPhone (Safari) or use Chrome DevTools mobile emulation.
- [ ] Verify the `MeetingTimeline` scrubber works via touch on mobile.
- [ ] Verify the recording import fallback accepts files via the native mobile file picker.

## 7. Edge Cases & Error Recovery
- [ ] Disconnect WiFi during live capture. Verify the extension shows a reconnect/error state and the console does not hang.
- [ ] Disconnect for less than 60 seconds. Verify unacknowledged frames replay without duplicate transcript segments.
- [ ] Disconnect for more than 60 seconds. Verify memory stays bounded and a visible transcript-gap marker identifies the missing interval.
- [ ] Close the captured Meet tab. Verify capture ends as a terminal condition and the meeting finalizes or fails clearly.
- [ ] Send a RAG query, then immediately close the browser tab. (Ensures the backend handles disconnected clients gracefully without crashing).
- [ ] Import a corrupted audio file. Verify the Meeting transitions to a `FAILED` state with an `ErrorState` UI, rather than hanging in `PROCESSING` forever.

## 8. Self-Hosted Release Gate
- [ ] Install the documented bundle on a clean supported host; verify the repository actually contains every referenced Dockerfile/Compose artifact before publishing instructions.
- [ ] Verify only Nginx is publicly exposed and HTTPS/WSS upgrades work.
- [ ] Start without external AI, cloud storage, SMTP, analytics, or hosted telemetry credentials; complete capture/import/search locally.
- [ ] Observe outbound traffic during a synthetic meeting and verify no meeting content leaves operator-controlled infrastructure.
- [ ] Restore encrypted PostgreSQL/MinIO/configuration backups into an isolated host and verify citations and private media keys resolve.
