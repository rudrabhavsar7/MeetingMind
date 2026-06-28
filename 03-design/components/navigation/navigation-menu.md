---
Title: MeetingMind — Component: Navigation Menu
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Navigation Menu

## 1. Overview
A horizontal top-level navigation bar with dropdown menus (mega-menus).

## 2. Design Philosophy
Provides quick access to deep links without requiring clicks.

## 3. Problem Statement
Complex marketing sites or deep settings panels need structured, discoverable navigation.

## 4. UX Goals
* Discoverability.
* Keyboard accessibility.

## 5. Usage Guidelines
* Used primarily if MeetingMind implements a public Marketing Landing Page.
* Not heavily used in the core App Shell (which uses the vertical Sidebar).

## 6. When to Use
* Horizontal topbars with complex nested links.

## 7. When NOT to Use
* Inside the main dashboard (use Sidebar instead).

## 8. Component Anatomy
* Root (Nav).
* List (Flex row).
* Trigger (Button).
* Content (Dropdown/Mega-menu panel).

## 9. Variants
* Default.

## 10. Sizes
* Fluid.

## 11. States
* Hover to open content.

## 12. Layout Rules
* Horizontal list.

## 13. Content Guidelines
* N/A.

## 14. Icon Rules
* Down chevron next to triggers indicating dropdowns.

## 15. Color System
* Inherited.

## 16. Typography
* `text-sm font-medium`.

## 17. Spacing
* N/A.

## 18. Motion
* Smooth width/height animation when switching between dropdown content panels (handled by Radix).

## 19. Accessibility
* Very complex ARIA requirements. Fully managed by Radix UI `NavigationMenu`.

## 20. Keyboard Interaction
* Arrow keys to navigate top-level. Enter/Space to open. Esc to close.

## 21. Responsive Behavior
* Usually hidden on mobile, replaced by a Hamburger menu + Sheet.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`.

## 24. API Specification
```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4">...</ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

## 25. Props Reference
* Radix UI props.

## 26. Events
* N/A.

## 27. Composition
* N/A.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Animating the viewport height/width requires CSS transforms.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Navigation/NavMenu`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add navigation-menu`

## 37. Tailwind Mapping
* Complex `data-[state=open]` animations.

## 38. Implementation Notes
* Don't use this for simple dropdowns (e.g., User Profile). Use `DropdownMenu` for that. This is specifically for structural navigation menus.

## 39. QA Checklist
* Test hover delay intentionally built into Radix to prevent accidental closing.

## 40. Acceptance Criteria
* Accessible mega-menu.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* Limit usage. Horizontal mega-menus are tricky to maintain and often break on small desktop screens.
