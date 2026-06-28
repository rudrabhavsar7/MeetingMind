---
Title: MeetingMind — Component: Accordion
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Accordion

## 1. Overview
A vertically stacked set of interactive headings that each reveal a section of content.

## 2. Design Philosophy
Allows users to quickly scan high-level topics without being overwhelmed by the details of every topic simultaneously.

## 3. Problem Statement
The Settings page or an FAQ page contains too much text to read at once.

## 4. UX Goals
* Progressive disclosure.
* Keep context visible (headings stay on screen).

## 5. Usage Guidelines
* Use for FAQs.
* Use for complex, multi-section forms (e.g., Advanced AI Settings).

## 6. When to Use
* Compacting long, categorized text.

## 7. When NOT to Use
* If the user *must* read the content to proceed (don't hide it).
* For horizontal navigation (Use `Tabs`).

## 8. Component Anatomy
* Root.
* Item (Container for one section).
* Trigger (The clickable heading).
* Icon (Chevron indicating expand/collapse).
* Content (The hidden text).

## 9. Variants
* **Single:** Only one item can be open at a time (Accordion).
* **Multiple:** Users can open multiple items at once (Collapsible list).

## 10. Sizes
* `w-full`.

## 11. States
* Open/Closed.

## 12. Layout Rules
* Vertical stack.

## 13. Content Guidelines
* Triggers should clearly summarize the hidden content.

## 14. Icon Rules
* ChevronDown that rotates 180deg when open.

## 15. Color System
* Border bottom: `border-b`.
* Trigger text: `hover:underline`.

## 16. Typography
* Trigger: `font-medium`.
* Content: `text-sm`.

## 17. Spacing
* Trigger padding `py-4`.
* Content padding `pb-4 pt-0`.

## 18. Motion
* Smooth height animation (`animate-accordion-down` and `animate-accordion-up`).

## 19. Accessibility
* Uses `aria-expanded` and `aria-controls`.
* Trigger must be a `<button>`.

## 20. Keyboard Interaction
* Enter/Space to toggle.
* Up/Down arrows to jump between triggers.

## 21. Responsive Behavior
* Fluid width.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--border`.

## 24. API Specification
```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## 25. Props Reference
* `type`: "single" | "multiple".
* `collapsible`: Boolean (allows closing the only open item in single mode).

## 26. Events
* `onValueChange`.

## 27. Composition
* Based on Radix UI Accordion.

## 28. AI Usage Guidelines
* Can be used to list AI-generated Action Items, where clicking the item reveals the context/quote from the transcript that generated it.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* N/A.

## 31. Performance
* Height animations can be expensive if the content is very DOM-heavy, but fine for text.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Single, Multiple.

## 35. Figma Mapping
* `DataDisplay/Accordion`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add accordion`

## 37. Tailwind Mapping
* CSS Keyframes required in `tailwind.config.ts` for the height animation (`accordion-down`, `accordion-up`).

## 38. Implementation Notes
* Make sure `overflow-hidden` is on the content wrapper to make the height animation work smoothly.

## 39. QA Checklist
* Verify the chevron rotates on click.

## 40. Acceptance Criteria
* Smooth expansion, accessible.

## 41. Future Enhancements
* None.

## 42. CTO Notes
* N/A.
