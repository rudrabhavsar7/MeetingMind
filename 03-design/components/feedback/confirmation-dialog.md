---
Title: MeetingMind — Component: Confirmation Dialog
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/overlays/dialog.md
---

# MeetingMind Component: Confirmation Dialog

## 1. Overview
A specialized modal specifically designed to ask the user to confirm a destructive or significant action.

## 2. Design Philosophy
Preventing accidental data loss is paramount. Users move fast; this component serves as a final "speed bump" for critical actions.

## 3. Problem Statement
Clicking "Delete Meeting" instantly wiping the data is poor UX.

## 4. UX Goals
* Clear explanation of the consequence.
* Distinctive "Cancel" and "Confirm" buttons.

## 5. Usage Guidelines
* Use before any destructive action that cannot be undone via a Toast "Undo" button.

## 6. When to Use
* Deleting an entity (Meeting, Workspace).
* Leaving a workspace.

## 7. When NOT to Use
* For non-destructive actions.
* For complex forms (Use a standard `Dialog`).

## 8. Component Anatomy
* Overlay.
* Title ("Are you absolutely sure?").
* Description (The consequence).
* Footer (Cancel Button, Action Button).

## 9. Variants
* Destructive (Red action button).
* Standard (Primary action button).

## 10. Sizes
* Fixed `max-w-md`.

## 11. States
* Open/Closed.

## 12. Layout Rules
* Footer buttons are aligned to the right (Cancel on left, Action on right).

## 13. Content Guidelines
* The description MUST explain exactly what happens (e.g., "This will permanently delete the meeting and all associated transcript data from our servers. This action cannot be undone.").

## 14. Icon Rules
* N/A.

## 15. Color System
* If destructive, the primary button is `variant="destructive"` (Red).

## 16. Typography
* Same as Dialog.

## 17. Spacing
* Same as Dialog.

## 18. Motion
* Same as Dialog.

## 19. Accessibility
* Uses `role="alertdialog"`. This is a stricter ARIA role than `dialog` and screen readers announce it more urgently.

## 20. Keyboard Interaction
* Tab between Cancel and Confirm. **Esc must map to Cancel.**

## 21. Responsive Behavior
* Fits mobile screen.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--destructive`.

## 24. API Specification
```tsx
<AlertDialog>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 25. Props Reference
* Radix Alert Dialog props.

## 26. Events
* `onClick` on Action.

## 27. Composition
* Combines AlertDialog primitives.

## 28. AI Usage Guidelines
* N/A.

## 29. Error Handling
* Can show an error spinner inside the action button if the deletion fails over the network.

## 30. Edge Cases
* N/A.

## 31. Performance
* Fast.

## 32. Security Considerations
* N/A.

## 33. Analytics Events
* Track "cancelled" vs "confirmed" rates on destructive actions.

## 34. Storybook Stories
* Destructive, Standard.

## 35. Figma Mapping
* `Overlays/AlertDialog`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add alert-dialog`

## 37. Tailwind Mapping
* Same as Dialog.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* Press Esc to ensure the action is cancelled, not confirmed.

## 40. Acceptance Criteria
* Halts destructive actions until confirmed.

## 41. Future Enhancements
* For extreme actions (deleting a workspace), require the user to type the workspace name into an input field within the dialog before the Confirm button enables.

## 42. CTO Notes
* Standardize on this. No custom `window.confirm()` calls allowed.
