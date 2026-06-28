---
Title: MeetingMind — Spacing & Layout
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind — Spacing & Layout

MeetingMind relies on a consistent spacing scale to establish visual rhythm, group related information, and separate distinct concepts. 

## 1. The Spacing Scale

We strictly adhere to the default Tailwind CSS spacing scale, which is based on a `0.25rem` (4px) root unit.

| Tailwind Class | rem | px | Usage Example |
|---|---|---|---|
| `p-1` | 0.25rem | 4px | Internal spacing for small badges or icons. |
| `p-2` | 0.5rem | 8px | Spacing between tight list items or icon + text. |
| `p-4` | 1rem | 16px | Standard padding for small cards, buttons, or inputs. |
| `p-6` | 1.5rem | 24px | Standard padding for major panels and dialogs. |
| `p-8` | 2rem | 32px | Padding for large sections or marketing components. |
| `p-12` | 3rem | 48px | Margins between major page sections. |
| `p-16` | 4rem | 64px | Vertical spacing in empty states or hero sections. |

**Rule of Thumb:**
* Use **Multiples of 4** (`p-4`, `p-8`) for structural layout.
* Use **Multiples of 2** (`gap-2`, `p-2`) for micro-layout (elements inside a card).

## 2. Layout Patterns

### 2.1 The Application Shell
* **Sidebar:** Fixed width of `w-64` (256px).
* **Top Header:** Fixed height of `h-14` (56px) or `h-16` (64px).
* **Main Content Area:** Takes up remaining space `flex-1`.

### 2.2 Container Widths
To ensure long-form text (transcripts) remains readable, we restrict maximum widths.

* **Text Reading Width:** Use `max-w-prose` (approx 65-80 characters) for transcript blocks and AI summaries.
* **Dashboard Width:** Use `max-w-7xl` (1280px) centered (`mx-auto`) for the main dashboard view to prevent stretching on ultrawide monitors.

### 2.3 Flexbox & Grid Defaults
* **1D Layouts (Rows/Cols):** Default to `flex flex-col` or `flex flex-row`.
* **2D Layouts (Dashboards):** Use CSS Grid.
  * Example: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` for a responsive meeting card grid.

## 3. Gestalt Principles in Spacing

* **Proximity:** Elements that are related should be placed close together. E.g., The spacing between a form `<Label>` and its `<Input>` (`gap-1.5` or 6px) should be much smaller than the spacing between two entirely different form fields (`gap-6` or 24px).
* **White Space is not empty space:** In dense UIs like transcripts, ample padding between speaker blocks (`mb-6`) is required to give the eye a resting place and visually separate thoughts.

## 4. Z-Index Scale

To prevent stacking context wars, we use a predefined z-index scale:

| Component | Tailwind Class | Value |
|---|---|---|
| Background | `z-0` | 0 |
| Standard Content | `z-10` | 10 |
| Sticky Headers | `z-20` | 20 |
| Sidebar Navigation | `z-30` | 30 |
| Dropdowns & Popovers | `z-40` | 40 |
| Modals & Dialogs | `z-50` | 50 |
| Toasts & Notifications | `z-[100]` | 100 |
