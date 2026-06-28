---
Title: MeetingMind — Settings Pages
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 01-product/information-architecture.md
---

# MeetingMind — Settings Pages (`/settings/*`)

The Settings area handles application configuration, split into User-level settings and Workspace-level settings.

## 1. Global Settings Layout

The settings area uses a specialized layout distinct from the main App Shell, though it still lives within it.

* **Left Sidebar (Settings specific):** A secondary sidebar replacing the main navigation (or nested beside it).
  * Group 1: Personal (Profile, Preferences)
  * Group 2: Workspace (General, Members, Integrations) - *Only visible to Admins/Owners*
* **Main Content Area:** A standard `max-w-4xl` container holding the specific settings forms.

## 2. Workspace Settings (`/settings/workspace`)
* **Purpose:** High-level workspace configuration.
* **Elements:**
  * Workspace Name Input.
  * Danger Zone (Red border):
    * "Delete Workspace" (Requires typing the workspace name to confirm).

## 3. Members Settings (`/settings/members`)
* **Purpose:** RBAC management.
* **Layout:**
  * Top: "Invite Member" input (Email address + Role dropdown + Submit button).
  * Body: Data Table of current members.
    * Columns: User (Avatar + Name + Email), Role, Joined Date, Actions.
* **Interactions:**
  * Role column is a dropdown, allowing instant role changes (optimistic UI update).
  * Actions column contains a `MoreVertical` (meatballs) menu with "Remove User".

## 4. Integrations (`/settings/integrations`) - *v1.2+*
* **Purpose:** Connect MeetingMind to external tools.
* **Layout:** A grid of cards (Slack, Jira, Webhooks).
* **Card State:** Shows connection status (Connected / Disconnected). Clicking opens a configuration modal for that specific integration.

## 5. UI Consistency
* All forms use a consistent "Save Changes" pattern.
* **Save Buttons:** Pinned to the bottom of the form container, disabled unless `isDirty` (values have changed).
* **Toasts:** Confirm successful saves ("Workspace name updated").
