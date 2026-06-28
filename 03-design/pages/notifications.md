---
Title: MeetingMind — Notifications
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/layouts.md
---

# MeetingMind — Notifications (v1.1 Feature)

*Note: Dedicated notification centers are slated for v1.1. In v1.0, notifications are handled entirely via email and transient Toasts.*

## 1. Transient Notifications (v1.0 Toasts)

We use `sonner` (a React toast library) for all in-app transient notifications.

### 1.1 Styling
* Toasts appear at the bottom-right of the screen.
* They use the `--card` background color and inherit border styling.
* Success toasts include a green `CheckCircle2` icon.
* Error toasts include a red `XCircle` icon and `text-destructive`.

### 1.2 Triggers (v1.0)
* Meeting upload initiated.
* Meeting processing completed (triggered via polling if the user is in the app).
* Action item marked complete.
* Settings saved.

## 2. Notification Center (v1.1 Design)

In v1.1, an in-app notification center will be added.

### 2.1 Access
* A bell icon (`Bell`) is added to the Sidebar navigation, near the bottom.
* A red badge indicates unread count (e.g., a small circle with `bg-destructive`).

### 2.2 The Popover
* Clicking the bell opens a `Popover` displaying a feed of notifications.
* **Notification Types:**
  * `@mention` in a meeting summary/decision.
  * New Action Item assigned to you.
  * Meeting you uploaded finished processing.
* **Interactions:**
  * Clicking a notification routes the user to the relevant meeting/action item and marks it as read.
  * "Mark all as read" button at the top.
