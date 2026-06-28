---
Title: MeetingMind — Component: Toast (Sonner)
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Toast

## 1. Overview
A transient, non-modal notification that pops up to inform the user of a background process result (success or failure).

## 2. Design Philosophy
Provides immediate feedback for user actions without requiring them to dismiss a modal or lose their context.

## 3. Problem Statement
When a user clicks "Copy Link", they need confirmation that it worked, but they don't want a full-screen popup interrupting them.

## 4. UX Goals
* Unobtrusive confirmation.
* Auto-dismisses.

## 5. Usage Guidelines
* Use for success confirmations ("Meeting deleted", "Settings saved").
* Use for transient errors ("Network disconnected").

## 6. When to Use
* After form submissions.
* After clipboard actions.
* Background task completion.

## 7. When NOT to Use
* For critical errors requiring user intervention (Use a Dialog or static Alert).
* For long paragraphs of text.

## 8. Component Anatomy
* Container (Floating pill/box).
* Icon (Success/Error).
* Title.
* Description (Optional).
* Action/Undo button (Optional).

## 9. Variants
* Default (Informational).
* Success.
* Error.
* Promise (Loading spinner that transitions to Success/Error).

## 10. Sizes
* Fixed width, usually ~350px.

## 11. States
* Entering, Visible, Exiting.

## 12. Layout Rules
* Positioned fixed in a corner (usually bottom-right for desktop, top-center for mobile).

## 13. Content Guidelines
* Keep titles under 5 words.

## 14. Icon Rules
* Use standard Lucide icons based on variant.

## 15. Color System
* MeetingMind uses inverted high-contrast toasts (black background in light mode, white in dark mode) to ensure they stand out, or standard bordered variants based on `sonner` configuration.

## 16. Typography
* `text-sm`.

## 17. Spacing
* Stacked vertically in a viewport region.

## 18. Motion
* Slide in from the edge, slide out when dismissing.

## 19. Accessibility
* Must use an ARIA Live Region (`aria-live="polite"` or `"assertive"`).
* Must not disappear too quickly if it contains a required action.

## 20. Keyboard Interaction
* Focus can optionally be moved to the toast if it contains an "Undo" action, but typically they are passive.

## 21. Responsive Behavior
* Moves to `top-center` or `bottom-center` full width on mobile to avoid overlapping the keyboard.

## 22. Dark Mode
* Adjusts automatically.

## 23. Design Tokens
* `--background`, `--foreground`.

## 24. API Specification
We use `sonner` via shadcn/ui.

```tsx
import { toast } from "sonner"

// Basic
toast("Meeting saved successfully")

// With Action
toast("Meeting deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreMeeting(),
  },
})
```

## 25. Props Reference
* Handled via `sonner` function config object.

## 26. Events
* Auto-dismisses after ~4000ms.

## 27. Composition
* Requires a `<Toaster />` component at the root of the app (`app/layout.tsx`).

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* `toast.error("Failed to load")`

## 30. Edge Cases
* Multiple toasts spamming the screen. `sonner` handles stacking them elegantly.

## 31. Performance
* `sonner` is extremely lightweight and fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Trigger buttons for Success, Error, Action, Promise.

## 35. Figma Mapping
* `Feedback/Toast`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add sonner`

## 37. Tailwind Mapping
* Configured in the `<Toaster />` `toastOptions` using Tailwind classes.

## 38. Implementation Notes
* Prefer `sonner` over the older Radix-based shadcn `toast` component because `sonner` has a simpler imperative API and better stacking animations.

## 39. QA Checklist
* Ensure toasts don't cover critical FABs (Floating Action Buttons) on mobile.

## 40. Acceptance Criteria
* Pops up, vanishes after a delay, stacks correctly.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* Standardize all notifications on `sonner`. Remove any legacy toast implementations.
