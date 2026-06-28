---
Title: MeetingMind — Testing: QA Checklists
Version: 1.0.0
Status: Approved
Owner: Lead QA Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Testing: QA Checklists

## 1. Overview
Automated tests catch regressions, but human QA catches poor user experiences. This document outlines the manual checklists that must be completed before a major release.

## 2. The "New Meeting" Flow
- [ ] Upload a 5-minute MP4 video. Verify progress bar appears.
- [ ] Upload a 5-minute MP3 audio. Verify it is accepted.
- [ ] Attempt to upload a PDF. Verify it is rejected with a clear error message.
- [ ] Wait for processing. Verify the pipeline succeeds within ~15 minutes.
- [ ] Verify the UI automatically updates (via WebSocket/Polling) from "Processing" to the Meeting Details view without requiring a manual page refresh.

## 3. The Transcript & AI Quality Check
- [ ] Open a completed meeting. Verify the transcript exists.
- [ ] Click a `SpeakerChip` and rename "SPEAKER_01" to "Alex". Verify the name updates everywhere in the transcript.
- [ ] Read the AI Summary. Does it accurately reflect the uploaded media?
- [ ] Check the Action Items tab. Check off an item. Refresh the page. Verify it remains checked (persisted to DB).
- [ ] Click a `Citation [1]`. Verify the page scrolls smoothly to the exact transcript line.

## 4. The RAG Search Check
- [ ] Navigate to "Ask AI".
- [ ] Ask a question whose answer is known to be in the transcript (e.g., "What was the budget?").
- [ ] Verify the AI answers correctly and provides a citation.
- [ ] Ask a question completely unrelated to the meeting (e.g., "What is the capital of France?").
- [ ] Verify the AI refuses to answer, stating it relies only on meeting context (tests prompt boundaries).

## 5. Responsive & Cross-Browser Check
- [ ] Open the Dashboard in Chrome (Desktop).
- [ ] Open the Dashboard in Safari (macOS).
- [ ] Open the Dashboard in Firefox.
- [ ] Open the Dashboard on an iPhone (Safari) or use Chrome DevTools mobile emulation.
- [ ] Verify the `MeetingTimeline` scrubber works via touch on mobile.
- [ ] Verify the `UploadZone` accepts files via the native mobile file picker.

## 6. Edge Cases & Error Recovery
- [ ] Disconnect WiFi in the middle of a file upload. Verify the UI shows an error and allows retry.
- [ ] Send a RAG query, then immediately close the browser tab. (Ensures the backend handles disconnected clients gracefully without crashing).
- [ ] Upload a corrupted audio file. Verify the Meeting transitions to a `FAILED` state with an `ErrorState` UI, rather than hanging in `PROCESSING` forever.
