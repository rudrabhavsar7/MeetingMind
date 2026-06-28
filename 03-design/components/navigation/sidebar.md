---
Title: MeetingMind — Component: Sidebar
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/layouts.md, 03-design/navigation.md
---

# MeetingMind Component: Sidebar

## 1. Overview
The primary vertical navigation container anchored to the left edge of the application shell.

## 2. Design Philosophy
The sidebar provides a constant anchor for the user's mental model of the application structure. It should be un-intrusive yet always accessible.

## 3. Problem Statement
Users need a consistent way to navigate between major top-level views without losing their context.

## 4. UX Goals
* Provide persistent top-level navigation.
* Collapse gracefully on mobile screens.

## 5. Usage Guidelines
* Use strictly as the main app navigation within `app/layout.tsx` or similar root layout files.

## 6. When to Use
* Desktop viewports (`md` and up).

## 7. When NOT to Use
* On mobile viewports (use a Bottom Sheet or Drawer instead).
* For deep page-level navigation (use Tabs).

## 8. Component Anatomy
* Container (`aside`).
* Header (Logo + Workspace Switcher).
* Main Nav (List of Navigation Links).
* Footer (Settings, User Profile Dropdown).

## 9. Variants
* **Desktop Fixed:** Always visible, `256px` wide.
* **Mobile Drawer:** Contained within a `Sheet` component, slides in from left.

## 10. Sizes
* Fixed width of `w-64` (256px) on desktop.

## 11. States
* Active route highlights the corresponding link.

## 12. Layout Rules
* Extends full height `h-screen`. Fixed position or flex column in the main layout.

## 13. Content Guidelines
* Link text should be concise (1-2 words).

## 14. Icon Rules
* Every top-level link MUST have a leading Lucide icon (`w-5 h-5`).

## 15. Color System
* Background: `bg-muted/40` or `bg-background` with a `border-r`.
* Active link: `bg-muted text-primary`.

## 16. Typography
* Links use `text-sm font-medium`.

## 17. Spacing
* `p-4` internal padding. `gap-2` between links.

## 18. Motion
* None for the fixed desktop version. Mobile drawer slides in.

## 19. Accessibility
* Use `<nav>` semantic element.
* Active link must have `aria-current="page"`.

## 20. Keyboard Interaction
* Tab navigates through links.

## 21. Responsive Behavior
* Hidden via `hidden md:flex`.

## 22. Dark Mode
* Inherited via tokens.

## 23. Design Tokens
* `--muted`, `--border`, `--primary`.

## 24. API Specification
```tsx
<Sidebar className="hidden md:flex" />
```

## 25. Props Reference
* `className`: String for layout overrides.

## 26. Events
* N/A.

## 27. Composition
* Composes `NavigationLink`, `UserDropdown`, `WorkspaceSwitcher`.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Many links could cause vertical overflow. The central link list must be `overflow-y-auto` while the Header and Footer remain fixed.

## 31. Performance
* Static layout shell, very cheap.

## 32. Security Considerations
* Links that the user lacks RBAC permissions for should be hidden entirely, not just disabled.

## 33. Analytics Events
* Track clicks on major navigation items.

## 34. Storybook Stories
* Desktop View.

## 35. Figma Mapping
* `Layout/Sidebar`

## 36. shadcn/ui Mapping
* N/A (Custom composition).

## 37. Tailwind Mapping
* `flex h-full w-64 flex-col border-r bg-muted/40`

## 38. Implementation Notes
* Extract the link definitions into an array constant (`const NAV_LINKS = [...]`) to render them dynamically and keep the component clean.

## 39. QA Checklist
* Ensure scrolling works if the window height is very small.

## 40. Acceptance Criteria
* Sticks to the left, scrolls internally if needed.

## 41. Future Enhancements
* Collapsible state (icon-only mode) for power users who want more screen real estate.

## 42. CTO Notes
* Keep this component strictly presentation. Pass the current user and workspace context down as props to avoid heavy data fetching in the layout shell.
