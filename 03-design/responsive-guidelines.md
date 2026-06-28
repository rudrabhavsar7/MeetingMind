---
Title: MeetingMind — Responsive Guidelines
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-system.md
---

# MeetingMind — Responsive Guidelines

MeetingMind is designed primarily for desktop knowledge workers (viewing large transcripts and multi-panel layouts). However, it must degrade gracefully to tablet and mobile viewports for on-the-go reading and approval of action items.

## 1. Breakpoints

We use Tailwind's default breakpoints, applying a mobile-first approach.

| Breakpoint Prefix | Min-Width | Target Device | Layout Behavior |
|---|---|---|---|
| *(none)* | `0px` | Mobile (Phones) | Single column. Bottom or hamburger navigation. Stacked cards. |
| `sm:` | `640px` | Large Mobile / Small Tablet | Grid switches to 2 columns where appropriate. |
| `md:` | `768px` | Tablet (iPad Portrait) | Sidebar navigation appears (collapsible). Modals widen. |
| `lg:` | `1024px` | Laptop | Sidebar is permanently visible. Multi-panel layouts (Transcript + Summary side-by-side) activate. |
| `xl:` | `1280px` | Desktop | Max container widths reached. Extra whitespace allocated to margins. |
| `2xl:` | `1536px` | Ultrawide | No structural changes; max-widths prevent stretching. |

## 2. Layout Strategies

### 2.1 The App Shell (Navigation)
* **Mobile (`< md`):** The sidebar disappears. A top app bar appears with a hamburger menu that triggers a full-screen drawer (Sheet) containing the navigation links.
* **Desktop (`>= md`):** The left sidebar is fixed and takes up `250px`. The main content area takes up `calc(100vw - 250px)`.

### 2.2 Meeting Details View
This is the most complex responsive view in the application.

* **Mobile (`< lg`):** The view uses a Tab interface. The user sees *either* the AI Summary, the Transcript, *or* the Action Items.
* **Desktop (`>= lg`):** The view becomes a two-pane split. The left pane contains the Transcript. The right pane is a sticky sidebar containing the AI Summary and Action Items, allowing the user to read the summary while scrolling the transcript.

### 2.3 Data Tables
Data tables (e.g., list of all meetings) perform poorly on mobile.
* **Mobile:** Tables transform into a stacked list of Cards.
* **Desktop:** Standard HTML `<table>` with horizontal scrolling if columns exceed viewport width.

## 3. Touch Targets (Mobile)

* All clickable elements (buttons, links, transcript segments) MUST have a minimum touch target size of **44x44 pixels** on mobile devices.
* Use padding (`p-3` or `p-4`) on mobile to expand the clickable area without necessarily making the visual element massive.

## 4. Responsive Typography

Use Tailwind's responsive prefixes or `clamp()` for fluid typography to ensure text is readable on small screens without overwhelming the viewport.

```tsx
// Example: H1 grows from text-2xl on mobile to text-4xl on desktop
<h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
  {meeting.title}
</h1>
```

## 5. Modals and Dialogs

* **Desktop:** Render as centered `<Dialog>` overlays.
* **Mobile:** Often better rendered as bottom-anchored `<Drawer>` or `<Sheet>` components that slide up, providing a more native mobile feel and keeping touch targets near the bottom of the screen.
