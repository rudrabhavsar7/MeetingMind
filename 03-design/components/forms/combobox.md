---
Title: MeetingMind — Component: Combobox
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/forms/select.md
---

# MeetingMind Component: Combobox

## 1. Overview
An advanced selector that combines a text input (for searching/filtering) with a dropdown list.

## 2. Design Philosophy
When a user needs to pick from a list of dozens or hundreds of items (e.g., assigning a task to a user in a large workspace), a standard Select is too slow. Comboboxes enable rapid keyboard-driven selection.

## 3. Problem Statement
Scrolling through a list of 50 users to find "Maya" is inefficient.

## 4. UX Goals
* Allow fast, fuzzy searching of options.
* Support both single-select and multi-select paradigms.

## 5. Usage Guidelines
* Use for lists > 15 items.
* Use for asynchronous data selection (e.g., fetching users from the DB as the user types).

## 6. When to Use
* Assigning an Action Item to a workspace member.
* Tagging a meeting with multiple topics.

## 7. When NOT to Use
* For small, static lists (e.g., Status: Open/Closed). Use a `Select` or `RadioGroup`.

## 8. Component Anatomy
* **Trigger:** Usually a button that looks like an Input, showing the selected value(s).
* **Popover:** The dropdown container.
* **Search Input:** A text field fixed at the top of the popover.
* **Command List:** The scrollable area containing options.
* **Empty State:** "No results found."

## 9. Variants
* Single-select.
* Multi-select (Selected items appear as `Chip` components inside the trigger).

## 10. Sizes
* Trigger matches standard `h-10`.

## 11. States
* Hover, Focus, Open, Searching (Loading).

## 12. Layout Rules
* Popover width should ideally match the trigger width.

## 13. Content Guidelines
* Empty state text should be helpful.

## 14. Icon Rules
* Use a `ChevronsUpDown` icon for the trigger (differentiates it from a standard Select `ChevronDown`).
* Use `Check` to indicate selected items.

## 15. Color System
* Same as Select (Popover, Muted, Accent).

## 16. Typography
* `text-sm`.

## 17. Spacing
* Popover padding `p-1`.

## 18. Motion
* Standard popover fade-in.

## 19. Accessibility
* Uses `cmdk` which handles complex ARIA patterns for comboboxes.

## 20. Keyboard Interaction
* Arrow keys to navigate the filtered list.
* Enter to toggle selection.
* Backspace in multi-select mode removes the last selected `Chip`.

## 21. Responsive Behavior
* On mobile, the Popover often renders better as a full-screen Drawer to give the keyboard enough room.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--popover`, `--accent`.

## 24. API Specification
Built by composing Radix UI `Popover` with the `cmdk` library.

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox" aria-expanded={open}>
      {value ? value : "Select member..."}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="Search members..." />
      <CommandEmpty>No member found.</CommandEmpty>
      <CommandGroup>
        {members.map((member) => (
          <CommandItem key={member.value} onSelect={() => handleSelect(member.value)}>
            <Check className={cn("mr-2 h-4 w-4", value === member.value ? "opacity-100" : "opacity-0")} />
            {member.label}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>
```

## 25. Props Reference
* Varies based on implementation abstraction, usually takes `options`, `value`, `onChange`.

## 26. Events
* `onValueChange`.

## 27. Composition
* Combines `Popover` and `Command`.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Validation state applied to Trigger.

## 30. Edge Cases
* Multi-select with many items: The trigger must grow vertically to accommodate multiple `Chip`s, or collapse them into a "+3 more" badge.

## 31. Performance
* `cmdk` is fast, but rendering 10,000 items in the DOM will crash. Use windowing/virtualization if options exceed 500.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Single Select, Multi Select, Async Loading.

## 35. Figma Mapping
* `Core/Combobox`

## 36. shadcn/ui Mapping
* Does not exist as a single primitive. It is an undocumented pattern combining `Popover` and `Command` in the shadcn/ui docs.

## 37. Tailwind Mapping
* Standard popover classes.

## 38. Implementation Notes
* Abstract the shadcn/ui example into a reusable `<Combobox>` component to avoid repeating the verbose `Popover > Command` markup everywhere.

## 39. QA Checklist
* Test searching for an item, using arrow keys to select, and hitting enter.

## 40. Acceptance Criteria
* Functional search, keyboard accessible, returns correct value.

## 41. Future Enhancements
* Infinite scroll for async remote data.

## 42. CTO Notes
* The multi-select variant is notoriously tricky to build right. Steal a solid implementation from an open-source repo rather than building the multi-chip logic from scratch.
