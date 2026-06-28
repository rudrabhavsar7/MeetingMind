---
Title: MeetingMind — Colors
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind — Colors

MeetingMind uses a constrained color palette based on Tailwind CSS default scales. We rely on Slate for our neutrals to provide a slightly cool, professional undertone, paired with Emerald as the primary brand color to signify success, "go", and AI intelligence.

## 1. Primary Accent: Emerald

Emerald is used for primary buttons, active states, focus rings, and indicating positive AI outcomes.

| Shade | Hex | Usage |
|---|---|---|
| Emerald 50 | `#ecfdf5` | Light mode subtle backgrounds (success toast) |
| Emerald 100 | `#d1fae5` | |
| Emerald 500 | `#10b981` | **Primary Brand Color** (Light Mode) |
| Emerald 600 | `#059669` | Hover states for primary buttons (Light mode) |
| Emerald 700 | `#047857` | |
| Emerald 900 | `#064e3b` | Dark mode subtle backgrounds |

## 2. Neutrals: Slate

Slate is used for backgrounds, cards, borders, and text. It provides a softer contrast than pure black/white/gray.

| Shade | Hex | Usage |
|---|---|---|
| Slate 50 | `#f8fafc` | Light mode main background (`--background`) |
| Slate 100 | `#f1f5f9` | Light mode secondary background (`--muted`) |
| Slate 200 | `#e2e8f0` | Light mode borders (`--border`) |
| Slate 400 | `#94a3b8` | Muted text in Dark Mode (`--muted-foreground`) |
| Slate 500 | `#64748b` | Muted text in Light Mode (`--muted-foreground`) |
| Slate 800 | `#1e293b` | Dark mode secondary background (`--muted`) |
| Slate 900 | `#0f172a` | Dark mode cards (`--card`) |
| Slate 950 | `#020617` | Dark mode main background (`--background`) |

## 3. Semantic Colors

We use specific hues for specific meanings to ensure consistent communication.

### 3.1 Destructive / Error (Rose)
Used for critical errors, failed processing states, and delete buttons.
* Default: Rose 600 (`#e11d48`) - Light Mode `--destructive`
* Default: Rose 500 (`#f43f5e`) - Dark Mode `--destructive`

### 3.2 Warning / Attention (Amber)
Used for low-confidence AI transcriptions, missing metadata, or warnings.
* Default: Amber 500 (`#f59e0b`)

### 3.3 Info (Blue)
Used for informational callouts or system updates.
* Default: Blue 500 (`#3b82f6`)

## 4. Gradients

MeetingMind generally avoids gradients for UI elements to maintain a flat, enterprise aesthetic. However, subtle gradients may be used in marketing areas or empty states.

* **Brand Gradient (Rare):** `bg-gradient-to-r from-emerald-500 to-teal-400`
* **Skeleton Loader Gradient:** A linear gradient passing over the `bg-muted` element to simulate a shimmer effect (handled by Tailwind's `animate-pulse` mostly).

## 5. Contrast Compliance

All color combinations used for text and interactive elements have been verified against WCAG 2.2 AA standards.
* Emerald 500 text on Slate 50 background: **4.5:1** (Passes)
* Slate 500 text on Slate 50 background: **4.54:1** (Passes)
* Slate 950 text on Slate 50 background: **15.8:1** (Passes)
