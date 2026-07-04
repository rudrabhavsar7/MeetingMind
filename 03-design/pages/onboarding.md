---
Title: MeetingMind — Onboarding
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/pages/authentication.md
---

# MeetingMind — Onboarding Experience

Because MeetingMind is self-hosted, "Onboarding" occurs in two distinct phases: The Administrator (DevOps) setup, and the End-User (Employee) first login.

## 1. Phase 1: Administrator Setup

This occurs immediately after the IT Admin runs `docker compose up` and navigates to the instance IP/Domain for the first time.

### 1.1 The Setup Wizard (First Boot)
* **Trigger:** The database has exactly `0` users.
* **Layout:** Full-Screen Focus (like Auth pages).
* **Step 1: Admin Account.** The user is prompted to create the Owner account (Email + strong password).
* **Step 2: Workspace Creation.** The user names the first (and in v1.0, only) workspace (e.g., "Acme Corp Engineering").
* **Completion:** Redirects to the Dashboard. The system is now locked, and further sign-ups must be invited by this Admin.

## 2. Phase 2: End-User Onboarding

This occurs when an invited employee logs in for the first time.

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
If user testing shows confusion about RAG search, a one-time "Tour" can be implemented using a library like `react-joyride` to highlight the Command Palette (`Cmd+K`) and the AI Search tab.
