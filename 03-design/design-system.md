---
Title: MeetingMind — Design System
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 00-project/vision.md
Related Documents:
  - 03-design/color-palette.md
  - 03-design/typography.md
  - 03-design/accessibility.md
---

# MeetingMind — Design System

The MeetingMind design system ensures consistency, accessibility, and high development velocity across the platform. It is built on top of Tailwind CSS and Radix UI primitives (via shadcn/ui).

## 1. Design Philosophy

1. **Content First:** Meeting transcripts and summaries are information-dense. The UI should recede into the background, providing a neutral canvas that allows the text and AI insights to pop.
2. **Professional & Trustworthy:** As an enterprise tool handling sensitive data, the aesthetic must feel secure, stable, and polished. We avoid playful or overly casual design trends.
3. **Action-Oriented:** The primary goal of the app is not just reading, but acting on decisions and tasks. Interactive elements must be distinct and immediately recognizable.

## 2. The Tech Stack

* **Tailwind CSS v4:** For all utility-based styling and responsive design.
* **Radix UI:** Unstyled, accessible React primitives (Dialog, Dropdown, Tabs).
* **shadcn/ui:** Copy-paste component wrappers around Radix + Tailwind.
* **Framer Motion:** For layout transitions and micro-interactions.
* **Lucide React:** The official icon library.

## 3. Core Tokens

The design system is heavily tokenized using CSS variables injected into the Tailwind theme configuration.

### 3.1 Colors (Overview)
* **Backgrounds:** Slate/Zinc neutrals. True dark mode (not pure black, but very dark slate).
* **Primary Accent:** Emerald (`#10b981`). Represents success, action, and AI-generated insights.
* **Destructive:** Rose (`#e11d48`). Used for deletions and critical errors.
* *(See [Color Palette](color-palette.md) for exact hex codes and usage rules).*

### 3.2 Typography (Overview)
* **Font Family:** `Outfit` (Google Fonts). Geometric, clean, and highly legible for long-form reading.
* **Scale:** Based on a major third scale.
* *(See [Typography](typography.md) for precise sizing and weights).*

### 3.3 Spacing & Layout
* **Base Unit:** 4px (Tailwind's default `0.25rem`).
* **Container Widths:** 
  * Max reading width for transcripts: `80ch` (approx `800px`).
  * Dashboard max width: `1280px` (`max-w-7xl`).
* **Border Radius:** `0.5rem` (`rounded-lg`) for most components (cards, dialogs). `0.375rem` (`rounded-md`) for smaller interactive elements (buttons, inputs).

## 4. Component Architecture

All UI components are categorized into three levels:

1. **Foundation (`components/ui/`):** The atomic layer. Buttons, Inputs, Labels, Badges. Managed via shadcn/ui CLI.
2. **Patterns (`components/forms/`, `components/layout/`):** Combinations of foundation components. A form group with an input, label, and error message. A sidebar navigation menu.
3. **Features (`components/meeting/`):** Domain-specific assemblies. The Transcript Viewer. The AI Summary Card.

## 5. Theming (Dark Mode)

MeetingMind supports Light, Dark, and System-Preference modes.
* Theming is handled via CSS variables in `globals.css` (e.g., `--background`, `--foreground`, `--primary`).
* Tailwind classes use semantic names (`bg-background text-foreground`) rather than hardcoded colors (`bg-white text-black`), ensuring automatic theme switching.

## 6. Contribution Guidelines

Before introducing a new design pattern or component:
1. Check if a Radix UI primitive or shadcn/ui component already solves the problem.
2. Ensure the component meets WCAG 2.2 AA accessibility standards.
3. Document the component in the `03-design/components/` directory using the standard 42-section template.
