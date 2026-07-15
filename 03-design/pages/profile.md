---
Title: MeetingMind — Profile Page
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-11
Dependencies: 03-design/pages/settings.md, 02-engineering/jira-api-contracts.md
---

# MeetingMind — Profile Page (`/settings/profile`)

The Profile page allows individual users to manage their personal information and preferences, distinct from the broader Workspace settings.

## 1. Page Purpose
To handle personal identity, security (passwords), and UI preferences (theme).

## 2. Layout Structure

The page sits within the main Settings layout and is divided into distinct thematic cards/sections to prevent overwhelming the user.

### 2.1 Personal Information Section
* **Avatar Upload (v1.1; not shown in v1.0):**
  * A circular avatar preview (100x100).
  * Overlay on hover: "Change Avatar" (Camera Icon).
  * Clicking opens a file picker (Max 2MB, JPG/PNG).
* **Fields:**
  * Full Name (Input).
  * Email Address (Disabled/Read-only in v1.0, requires admin intervention to change to prevent account hijacking).
* **Action:** "Save Changes" button, disabled until the name is altered in v1.0. Avatar changes join this mutation flow in v1.1 after an upload contract exists.

### 2.2 Security Section
* **Header:** "Change Password".
* **Fields:**
  * Current Password.
  * New Password.
  * Confirm New Password.
* **Action:** "Update Password" button.
* **Feedback:** Standard inline validation for password match and strength.

### 2.3 Preferences Section
* **Header:** "Appearance".
* **Theme Toggle:**
  * A segmented control (or set of 3 cards) illustrating Light, Dark, and System Default.
  * Clicking immediately updates the DOM `className` on the `<html>` element, providing instant visual feedback.

## 3. Data Management (TanStack Query)
* Profile data is fetched via `/api/v1/auth/me` and cached.
* Display-name changes use `PATCH /api/v1/users/me`; password changes use `POST /api/v1/auth/change-password` and must not share mutation/error state with the profile form.
* On successful name mutation, invalidate `['user', 'me']` so the sidebar/header name updates. Avatar invalidation applies only after v1.1 implements it.
