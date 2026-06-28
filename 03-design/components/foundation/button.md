---
Title: MeetingMind — Component: Button
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-tokens.md, 03-design/typography.md
---

# MeetingMind Component: Button

## 1. Overview
The Button component is the primary interactive element in MeetingMind, used to trigger actions, submit forms, and confirm decisions.

## 2. Design Philosophy
Buttons should be instantly recognizable, provide immediate tactile feedback, and clearly communicate their hierarchical importance within a view.

## 3. Problem Statement
Inconsistent button usage leads to cognitive overload. Users need to know instantly which action is primary (e.g., "Upload Meeting") vs. secondary (e.g., "Cancel").

## 4. UX Goals
* Provide clear visual hierarchy.
* Ensure WCAG 2.2 AA compliant contrast.
* Support loading states natively to prevent double-submissions.

## 5. Usage Guidelines
* Use concise, action-oriented labels (verb + noun: e.g., "Save Changes").
* Keep labels to a single line.

## 6. When to Use
* To submit a form.
* To trigger an API mutation.
* To open a critical modal.

## 7. When NOT to Use
* For inline text links (use an anchor tag or `Link` component).
* As a toggle state (use a Switch or Checkbox).

## 8. Component Anatomy
* Container (Padding, Background, Border, Radius).
* Label (Text).
* Optional Leading Icon.
* Optional Trailing Icon.
* Focus Ring.

## 9. Variants
1. **Default (Primary):** Solid Emerald. For the main action on a page.
2. **Secondary:** Solid muted Slate. For alternative actions.
3. **Outline:** Transparent with Slate border. For tertiary actions.
4. **Ghost:** Transparent, no border. For subtle actions in toolbars.
5. **Destructive:** Solid Rose. For dangerous actions (Delete).
6. **Link:** Looks like a text link, behaves like a button.

## 10. Sizes
* `sm`: `h-9 px-3 text-xs`
* `default`: `h-10 px-4 py-2`
* `lg`: `h-11 px-8 rounded-md`
* `icon`: `h-10 w-10`

## 11. States
* Default
* Hover (`brightness-90` or `bg-accent`)
* Active / Pressed (`scale-95`)
* Disabled (`opacity-50 cursor-not-allowed`)
* Loading (Replaces leading icon with Spinner, sets disabled state)

## 12. Layout Rules
* Do not stretch buttons to 100% width unless on mobile or in a tight column (like a login form).

## 13. Content Guidelines
* Sentence case ("Save changes", not "Save Changes").
* Maximum 3 words.

## 14. Icon Rules
* Use Lucide React icons.
* Size `w-4 h-4` for `default` and `sm` buttons.
* Size `w-5 h-5` for `lg` buttons.
* Maintain `mr-2` spacing for leading icons.

## 15. Color System
* Primary: `--primary` background, `--primary-foreground` text.
* Destructive: `--destructive` background.

## 16. Typography
* Font-weight: Medium (500).
* Font-family: Outfit.

## 17. Spacing
* See size variants for internal padding.
* Gap between adjacent buttons: `gap-2` (8px).

## 18. Motion
* `transition-colors duration-200` on hover.
* Framer motion `whileTap={{ scale: 0.98 }}` for tactile feedback.

## 19. Accessibility
* Minimum contrast ratio 4.5:1.
* Must use standard `<button>` HTML tag, not a `<div>`.

## 20. Keyboard Interaction
* Focusable via `Tab`.
* Triggerable via `Enter` and `Space`.
* Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

## 21. Responsive Behavior
* On screens `< sm`, primary action buttons in fixed bottom bars may expand to `w-full`.

## 22. Dark Mode
* Borders and muted backgrounds automatically shift via CSS variables.

## 23. Design Tokens
* Uses `--radius`, `--primary`, `--secondary`, `--destructive`, `--ring`.

## 24. API Specification
Built on top of `@radix-ui/react-slot` and `class-variance-authority` (cva).

## 25. Props Reference
* `variant`: Enum (default, destructive, outline, secondary, ghost, link).
* `size`: Enum (default, sm, lg, icon).
* `asChild`: Boolean (if true, merges props onto the immediate child).
* `isLoading`: Boolean (shows spinner).
* Native button props (`onClick`, `disabled`, `type`).

## 26. Events
* Standard `onClick`.

## 27. Composition
Can be composed with Tooltips if the button is `icon` only.

## 28. AI Usage Guidelines
* If a button triggers an AI action (e.g., "Generate Summary"), it should ideally include the `Sparkles` icon to denote AI involvement.

## 29. Error Handling
* Buttons do not handle errors directly, but their `isLoading` state must be reverted to `false` if an API call fails.

## 30. Edge Cases
* Very long text: Should truncate with ellipsis (`truncate`) rather than wrapping to two lines.

## 31. Performance
* Use React `memo` only if rendering hundreds of buttons (unlikely).

## 32. Security Considerations
* Ensure buttons executing sensitive mutations (Delete) are gated by RBAC hooks (see `authorization.md`).

## 33. Analytics Events
* Add `data-analytics-id` prop for PostHog tracking on critical conversion buttons (e.g., "Sign Up").

## 34. Storybook Stories
* Default, All Variants, All Sizes, Loading State, Disabled State, Icon Left, Icon Right.

## 35. Figma Mapping
* Component matches `Core/Button` in the Figma design system.

## 36. shadcn/ui Mapping
* Direct export from `npx shadcn-ui@latest add button`.
* Modified only to add `isLoading` prop and Framer Motion tap animation.

## 37. Tailwind Mapping
* Relies on `cva` for class string construction.

## 38. Implementation Notes
* Export the `buttonVariants` cva function so other components (like Links) can look like buttons without using the `<button>` tag.

## 39. QA Checklist
* Test Tab focus.
* Test Enter/Space trigger.
* Verify spinner appears and button is disabled when `isLoading=true`.

## 40. Acceptance Criteria
* Renders correctly in Light/Dark mode.
* Passes Axe accessibility checks.

## 41. Future Enhancements
* Ripple effect on click (Material design style, though potentially clashes with minimal aesthetic).

## 42. CTO Notes
* Standardize on this component immediately. No rogue `<button className="...">` tags allowed in the codebase.
