---
Title: MeetingMind — Layouts
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/responsive-guidelines.md
---

# MeetingMind — Layouts

This document defines the macro-level structure of the application. MeetingMind relies on three primary layout templates.

## 1. The App Shell (Authenticated View)

The App Shell is the root layout (`app/layout.tsx` or a nested `app/(app)/layout.tsx`) that wraps all authenticated pages.

### Structure
* **Left Sidebar (Desktop):** `w-64` (256px), fixed to the left edge, `h-screen`. Contains primary navigation and user profile dropdown at the bottom.
* **Top App Bar (Mobile):** `h-14`, fixed to the top. Contains a hamburger menu triggering a `Sheet` (Drawer) that holds the sidebar contents.
* **Main Content Area:** Takes up the remaining viewport space. It is responsible for its own scrolling behavior (usually `overflow-y-auto`).

### CSS Grid/Flex Implementation
```tsx
// Simplified App Shell Layout
<div className="flex min-h-screen flex-col md:flex-row">
  {/* Sidebar (Hidden on mobile, block on md+) */}
  <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
    <Navigation />
  </aside>
  
  {/* Mobile Header (Block on mobile, hidden on md+) */}
  <header className="flex md:hidden h-14 border-b items-center px-4">
    <MobileMenuSheet />
  </header>
  
  {/* Main Content */}
  <main className="flex-1 flex flex-col overflow-hidden">
    {children}
  </main>
</div>
```

## 2. The Split-Pane View (Meeting Details)

Used for `/meetings/[id]`. This layout maximizes reading space while keeping context (AI Summary/Actions) accessible.

### Structure
* **Header:** Contains Meeting Title, Status badges, and actions (Export, Delete).
* **Left Pane (Transcript):** Takes up `~60%` of the width on large screens. Scrolls independently.
* **Right Pane (AI Insights):** Takes up `~40%` of the width. Often `sticky` to the top so it remains visible as the user scrolls down the long transcript.

### Responsive Behavior
* On screens `< lg` (1024px), the split-pane collapses into a standard single column. The right pane (Insights) is transformed into Tabs above the transcript.

## 3. The Feed View (Dashboard & Lists)

Used for `/dashboard`, `/meetings` (list), and `/actions`.

### Structure
* **Header:** Page Title and primary action (e.g., "Upload Meeting" button).
* **Filters/Search Bar:** Sticky under the header.
* **Content Grid/List:**
  * For Action Items: A vertical list spanning `max-w-4xl`.
  * For Meetings: A CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) of summary cards.

## 4. Full-Screen Focus (Auth & Setup)

Used for `/login`, `/register`, and initial workspace setup.

### Structure
* No sidebar. No top navigation (except perhaps a logo).
* A centered card (`max-w-sm` or `max-w-md`) containing the form.
* Background is typically a subtle off-white (`bg-slate-50`) or includes a subtle, slow-moving abstract background to feel premium without distracting from the form.
