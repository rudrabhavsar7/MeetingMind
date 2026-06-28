---
Title: MeetingMind — Typography
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-system.md
---

# MeetingMind — Typography

MeetingMind relies on clear, highly legible typography to make dense information (like 10,000-word transcripts) scannable and readable.

## 1. Font Families

MeetingMind uses a single font family to maintain a clean, cohesive look.

* **Primary Font:** [Outfit](https://fonts.google.com/specimen/Outfit)
  * **Characteristics:** A geometric sans-serif that balances modern tech aesthetics with excellent legibility.
  * **Implementation:** Loaded via `next/font/google` for zero layout shift (CLS).
  * **Fallback:** `sans-serif` (system fonts: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial`).

## 2. Typographic Scale

We utilize Tailwind's default typographic scale, customized slightly for line heights to improve reading stamina on dense blocks of text.

| Tailwind Class | Font Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|
| `text-xs` | 12px (0.75rem) | 16px | Normal | Metadata, timestamps, small badges |
| `text-sm` | 14px (0.875rem) | 20px | Normal | Secondary text, table data, sidebar links |
| `text-base` | 16px (1rem) | 28px (relaxed) | Normal | **Body text, transcript text, AI summaries** |
| `text-lg` | 18px (1.125rem) | 28px | Normal | Subtitles, intro paragraphs |
| `text-xl` | 20px (1.25rem) | 28px | -0.01em | H4, Card Titles |
| `text-2xl` | 24px (1.5rem) | 32px | -0.01em | H3, Section headers |
| `text-3xl` | 30px (1.875rem) | 36px | -0.02em | H2, Page headers |
| `text-4xl` | 36px (2.25rem) | 40px | -0.02em | H1, Major Marketing / Hero headers |

## 3. Font Weights

We restrict weights to three options to minimize font file size and maintain consistency.

* **Regular (400):** Default for all body text.
* **Medium (500):** Used for buttons, tabs, table headers, and emphasis in text.
* **Bold (700):** Used for H1-H4 headings and critical data points.

## 4. Reading Optimization (Transcripts)

Because users spend the majority of their time reading transcripts and summaries:

1. **Line Length (Measure):** Paragraphs should never span the full width of a wide monitor. Restrict text blocks to `max-w-prose` (approx 65-80 characters per line).
2. **Line Height (Leading):** Body text utilizes `leading-relaxed` (1.75) to give the text room to breathe, preventing the eye from skipping lines.
3. **Contrast:** Body text uses `text-foreground` (or `text-slate-900` / `text-slate-100`) for maximum contrast, while metadata uses `text-muted-foreground` to establish visual hierarchy without clutter.

## 5. Code & Formatting (Markdown)

AI Summaries and Decisions are often generated in Markdown. We use `@tailwindcss/typography` (`prose` classes) to style this rendered HTML.

* **Inline Code:** Uses a monospace font (system default `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`), styled with a subtle background and border radius.
* **Blockquotes:** Indented with a primary color (`border-emerald-500`) left border to denote extracted insights or decisions.
