---
Title: MeetingMind — Testing: Accessibility Testing
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Testing: Accessibility (a11y)

## 1. Overview
MeetingMind must be usable by everyone, regardless of physical or cognitive ability. We target **WCAG 2.2 AA** compliance. Accessibility testing ensures our UI components and workflows meet these standards.

## 2. Automated Testing

### 2.1 ESLint (`eslint-plugin-jsx-a11y`)
The first line of defense. Enforces basic rules during development:
* Requires `alt` text on `<img>`.
* Enforces `aria-roles` correctness.
* Prevents click handlers on non-interactive elements (like `<div>`) without keyboard equivalents.

### 2.2 axe-core (Playwright Integration)
We inject `axe-core` into our E2E Playwright tests to scan the rendered DOM for accessibility violations.

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Dashboard should not have automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## 3. Manual Testing

Automated tools only catch ~30% of accessibility issues (like missing ARIA labels or poor color contrast). The remaining 70% requires manual testing.

### 3.1 Keyboard Navigation
* **Rule:** A user must be able to complete all primary workflows using *only* the `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Arrow` keys.
* **Focus States:** Every interactive element MUST have a visible focus ring (`focus-visible:ring-2`).

### 3.2 Screen Readers
Developers must periodically test complex components (like the `TranscriptViewer` or `AISearchInput`) using real screen readers:
* **Mac:** VoiceOver.
* **Windows:** NVDA or JAWS.

### 3.3 The "Zoom" Test
* Zoom the browser to 200% and 400%.
* Ensure text does not clip, overlap, or disappear. The layout should reflow gracefully into a mobile-like view.

## 4. Component-Specific A11y Guidelines

* **Dialogs/Modals:** Must trap focus inside the modal while open. Pressing `Escape` must close the modal and return focus to the trigger button. (Shadcn/Radix UI handles this natively).
* **Toasts:** Must use `aria-live="polite"` so screen readers announce them without interrupting current speech.
* **AI Confidence Indicators:** Color alone cannot convey meaning. A red "Low Confidence" dot must include visually hidden text (`<span className="sr-only">Low Confidence</span>`).

## 5. Color Contrast
All text must meet a contrast ratio of **4.5:1** against its background (WCAG AA). 
* Specifically audit the "Dark Mode" theme, as subtle grays can often fail contrast checks against black backgrounds.
