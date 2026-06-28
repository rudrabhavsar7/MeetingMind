---
Title: MeetingMind — Component: Tabs
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md
---

# MeetingMind Component: Tabs

## 1. Overview
A set of layered sections of content that display one panel of content at a time.

## 2. Design Philosophy
Tabs organize complex interfaces into digestible, related chunks without requiring a hard page refresh or losing context.

## 3. Problem Statement
The Meeting Details page contains a Summary, Transcript, Decisions, and Action Items. Displaying them all vertically requires endless scrolling.

## 4. UX Goals
* Keep users in context.
* Prevent overwhelming cognitive load.

## 5. Usage Guidelines
* Use when content is logically distinct but related to the same parent entity.

## 6. When to Use
* Meeting Details right pane (Summary | Decisions | Actions).
* Settings sections.

## 7. When NOT to Use
* For sequential steps (use a Stepper).
* For top-level page navigation (use Sidebar).

## 8. Component Anatomy
* Root (Tabs).
* List (The container for the triggers).
* Trigger (The button representing a tab).
* Content (The panel that appears when a tab is active).

## 9. Variants
* **Pill (Default):** A segmented control style where the active tab has a solid background.
* **Underline:** A minimalist style where the active tab has a primary-colored bottom border.

## 10. Sizes
* `h-10` for the List container.

## 11. States
* Active (`data-[state=active]`).
* Inactive.
* Disabled.

## 12. Layout Rules
* List is usually `inline-flex`.

## 13. Content Guidelines
* Tab names should be 1-2 words.

## 14. Icon Rules
* Optional. Often used in Settings tabs (e.g., `User` icon + "Profile").

## 15. Color System
* Pill variant active: `bg-background text-foreground shadow-sm`.
* List background: `bg-muted`.

## 16. Typography
* `text-sm font-medium`.

## 17. Spacing
* Padding `px-3 py-1.5`.

## 18. Motion
* Immediate switch. Content fading is usually disabled for speed, but the Pill background slides between tabs (if implemented with Framer Motion).

## 19. Accessibility
* Requires `role="tablist"`, `role="tab"`, and `role="tabpanel"`. Fully managed by Radix UI.

## 20. Keyboard Interaction
* Arrow keys switch tabs (manual or automatic activation depending on configuration).

## 21. Responsive Behavior
* On mobile, if tabs exceed width, the `List` must be horizontally scrollable with `overflow-x-auto overflow-y-hidden` and hide the scrollbar.

## 22. Dark Mode
* Adjusts automatically.

## 23. Design Tokens
* `--muted`, `--background`.

## 24. API Specification
```tsx
<Tabs defaultValue="summary">
  <TabsList>
    <TabsTrigger value="summary">Summary</TabsTrigger>
    <TabsTrigger value="transcript">Transcript</TabsTrigger>
  </TabsList>
  <TabsContent value="summary">...</TabsContent>
  <TabsContent value="transcript">...</TabsContent>
</Tabs>
```

## 25. Props Reference
* `defaultValue`, `value`, `onValueChange`.

## 26. Events
* `onValueChange`.

## 27. Composition
* Combines List, Trigger, Content.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Only renders the active `TabsContent` to the DOM by default (though `forceMount` can be used to pre-render for SEO/search).

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track tab switches to see which features are used most (e.g., Do users actually read the full transcript?).

## 34. Storybook Stories
* Default, Underline variant, Scrollable mobile view.

## 35. Figma Mapping
* `Navigation/Tabs`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add tabs`

## 37. Tailwind Mapping
* `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground`

## 38. Implementation Notes
* Sync the active tab state with the URL query parameters (e.g., `?tab=transcript`) using Next.js `useRouter` so users can link directly to a specific tab.

## 39. QA Checklist
* Ensure arrow key navigation works.

## 40. Acceptance Criteria
* Switches content instantly, accessible.

## 41. Future Enhancements
* Framer Motion layout animations for the active background pill.

## 42. CTO Notes
* URL syncing is mandatory for the Meeting Details page tabs.
