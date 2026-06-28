---
Title: MeetingMind — Navigation
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 01-product/information-architecture.md
---

# MeetingMind — Navigation

Navigation in MeetingMind is designed to be flat, fast, and accessible via keyboard shortcuts.

## 1. Sidebar Navigation (Primary)

The sidebar is the anchor of the user experience. 

### Structure
* **Top:** Application Logo & Workspace Switcher (Dropdown).
* **Middle (Main Links):**
  * Dashboard (Home)
  * Meetings
  * Action Items
  * AI Search
* **Bottom:**
  * Settings
  * User Profile (Dropdown: Theme toggle, Log out).

### Active States
* The currently active route MUST be visually distinct.
* **Token:** `bg-muted text-primary font-medium`.
* **Inactive Token:** `text-muted-foreground hover:bg-muted/50 hover:text-foreground`.

## 2. Global Command Palette (Cmd+K)

Because power users (engineers, PMs) prefer keyboards, MeetingMind features a global command palette triggered by `Cmd+K` (Mac) or `Ctrl+K` (Windows).

### Functionality
* **Fuzzy Search:** Typing "sync" will surface recent meetings titled "Weekly Sync" or "Marketing Sync".
* **Quick Actions:** Typing ">" shifts the palette into command mode (e.g., "> Upload Meeting", "> Toggle Dark Mode", "> Go to Settings").
* **Implementation:** Built using `cmdk` (wrapped by shadcn/ui `<Command>`).

## 3. Breadcrumbs (Tertiary)

Breadcrumbs provide context when deep within the application (e.g., viewing a specific meeting or a nested settings page).

### Rules
* Displayed at the top left of the `<main>` content area, just below the header.
* Format: `Parent / Current Page`.
* Only the parent paths are clickable links. The current page is standard text (`text-foreground`).
* Example: `Meetings / Q3 Architecture Review`

## 4. Tabs (Contextual)

Tabs are used to switch views *within* a single entity, preventing unnecessary page loads and URL clutter (though the active tab may be synced to the URL query string for shareability).

### Usage
* **Meeting Details:** Summary | Transcript | Decisions | Action Items
* **Settings:** Profile | Workspace | Members

### Design
* Implemented via Radix UI `<Tabs>`.
* Active tab has a bottom border (`border-primary`) or is rendered as a segmented control (pill shape).

## 5. Pagination

When dealing with large lists (e.g., "All Meetings"), we use cursor-based pagination on the backend, presented as "Load More" or standard `[<] [1] [2] [3] [>]` controls on the frontend depending on the context.

* **Dashboard Feeds:** Use a "Load More" button or infinite scroll.
* **Data Tables (Admin views):** Use explicit page number controls.
