---
Title: MeetingMind — Component: Command Palette
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Command Palette

## 1. Overview
A globally accessible search and command execution interface, typically triggered via a keyboard shortcut (`Cmd+K`).

## 2. Design Philosophy
Power users prefer keyboards. The command palette acts as the "Spotlight" search for the entire application, removing the need to navigate manually through menus.

## 3. Problem Statement
Finding a specific meeting from 3 months ago or navigating to a buried settings page requires too many clicks.

## 4. UX Goals
* Instant access from anywhere.
* Fuzzy matching for typos.

## 5. Usage Guidelines
* Global hotkey: `Cmd+K` (Mac) or `Ctrl+K` (Windows).

## 6. When to Use
* Global search.
* Quick actions (e.g., "Create new meeting").

## 7. When NOT to Use
* For complex forms (use a Dialog instead).

## 8. Component Anatomy
* Overlay backdrop.
* Centered Modal.
* Search Input (always focused).
* List of Results (Grouped by type).

## 9. Variants
* Global Command (Modal).
* Inline Command (Combobox popover).

## 10. Sizes
* `max-w-xl`.

## 11. States
* Empty State: "No results found."

## 12. Layout Rules
* Centered on screen, positioned slightly towards the top (`top-[20%]`).

## 13. Content Guidelines
* Group results logically (e.g., "Recent Meetings", "Actions", "Settings").

## 14. Icon Rules
* Result items should have leading icons to denote their type.

## 15. Color System
* Background `--popover`.

## 16. Typography
* `text-sm`.

## 17. Spacing
* Padding `p-2` around groups.

## 18. Motion
* Fade-in and slight scale-up on trigger.

## 19. Accessibility
* Managed by `cmdk`. Requires `role="dialog"` for the wrapper.

## 20. Keyboard Interaction
* Fully keyboard navigable. Esc to close.

## 21. Responsive Behavior
* Drops to full-width drawer or modal on mobile.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`.

## 24. API Specification
```tsx
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

## 25. Props Reference
* Extends `cmdk` props.

## 26. Events
* `onSelect` for items.

## 27. Composition
* Combines Dialog and Command.

## 28. AI Usage Guidelines
* Can include a "Ask AI..." action that jumps directly to the RAG Search page with the current query.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Very fast.

## 32. Security Considerations
* Ensure search results respect RBAC.

## 33. Analytics Events
* Track which commands are most used.

## 34. Storybook Stories
* Default.

## 35. Figma Mapping
* `Navigation/Command`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add command`

## 37. Tailwind Mapping
* `fixed inset-0 z-50 bg-background/80 backdrop-blur-sm`

## 38. Implementation Notes
* Abstract the global state (open/closed) into a React Context or Zustand store so any component can trigger it.

## 39. QA Checklist
* Test Windows vs Mac hotkeys.

## 40. Acceptance Criteria
* Opens instantly via hotkey.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
