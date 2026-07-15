---
Title: MeetingMind — Onboarding
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-10
Dependencies: 03-design/pages/authentication.md
---

# MeetingMind — Onboarding Experience

Because MeetingMind is self-hosted, "Onboarding" occurs in two distinct phases: The Administrator (DevOps) setup, and the End-User (Employee) first login.

## 1. Phase 1: Administrator Setup

This occurs immediately after the IT Admin runs `docker compose up` and navigates to the instance IP/Domain for the first time.

### 1.1 The Setup Wizard (First Boot)
* **Trigger:** `GET /api/v1/auth/bootstrap-status` reports `setup_required=true`. The backend remains authoritative; the UI must not infer this only from an empty client response.
* **Layout:** Full-Screen Focus (like Auth pages).
* **Step 1: Admin Account.** The user is prompted to create the Owner account (Email + strong password).
* **Step 2: Workspace Creation.** The user names the first (and in v1.0, only) workspace (e.g., "Acme Corp Engineering").
* **Completion:** The backend atomically creates one Owner, one default workspace, and one Owner membership, then redirects to the Dashboard. The system closes public registration, and further users must be invited by an Owner or Admin.
* **Concurrent Setup:** If two operators submit simultaneously, only one transaction succeeds. The other sees that setup has already completed and is returned to Login.

## 2. Phase 2: End-User Onboarding

This occurs after an invited employee accepts a valid invitation and logs in for the first time. v1 does not show workspace creation or switching during onboarding.

### 2.1 The Empty State Dashboard
* A new user logs in and sees the Dashboard.
* **The Problem:** The "Recent Meetings" feed and "My Action Items" are completely empty, making the tool look broken or useless.
* **The Solution (The "Zero Data" State):**
  * Replace the empty lists with a centralized CTA block.
  * **Illustration:** A friendly, abstract graphic representing meetings/audio.
  * **Headline:** "Welcome to MeetingMind!"
  * **Body:** "There aren't any meetings in this workspace yet. Connect the Chrome extension to capture your first live meeting."
  * **Primary Button:** "Connect Extension" (Opens the extension connection flow).
  * **Secondary Button:** "Import Recording" (Opens the recording import fallback flow).

### 2.2 Tooltips (Optional v1.1)
If v1.1 user testing shows confusion about RAG search, a one-time tour may highlight the Command Palette (`Cmd+K`) and AI Search. This tour/library is not part of v1.0 acceptance.
