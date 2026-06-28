---
Title: MeetingMind — Component: Avatar
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Component: Avatar

## 1. Overview
The Avatar component displays a visual representation of a user (or occasionally a workspace/team). It falls back to initials if no image is provided.

## 2. Design Philosophy
Avatars humanize the interface, making it easier to parse long lists of action items or comments by providing a quick visual anchor for "who" is involved.

## 3. Problem Statement
Relying solely on names for attribution in data-dense views (like the transcript) creates a wall of text. Images are processed faster by the human brain.

## 4. UX Goals
* Instantly identify the actor/owner.
* Handle missing images gracefully.
* Load efficiently.

## 5. Usage Guidelines
* Use in the Topbar to indicate the current logged-in user.
* Use in data tables (Members list).
* Use next to transcript dialogue blocks to identify speakers.

## 6. When to Use
* Whenever a user identity needs to be represented visually.

## 7. When NOT to Use
* As a decorative element without a specific user context.

## 8. Component Anatomy
* Container (Circular with hidden overflow).
* Image (`<img>` element).
* Fallback (Text initials).

## 9. Variants
1. **Default:** Circular (Used for users).
2. **Square:** Slightly rounded corners (Used for workspaces/organizations - rare in v1.0).

## 10. Sizes
* `sm`: 24x24px (Inline with text or dense lists).
* `default`: 32x32px or 40x40px (Sidebar, topbar).
* `lg`: 64x64px or larger (Profile settings page).

## 11. States
* Standard: Displays image.
* Loading: Displays a generic silhouette or solid color while the image fetches.
* Error: Displays the fallback initials if the image URL returns a 404.

## 12. Layout Rules
* Almost always used `inline-flex` or aligned within a flex row.

## 13. Content Guidelines
* Fallback text should be exactly 2 characters (First initial, Last initial).

## 14. Icon Rules
* N/A.

## 15. Color System
* Fallback background: `bg-muted` or a generated color based on a hash of the user's ID to provide deterministic variety.
* Fallback text: `text-muted-foreground` or white/black depending on the background hash.

## 16. Typography
* Fallback text is `font-medium` and scales with the avatar size.

## 17. Spacing
* Fully rounded (`rounded-full`).

## 18. Motion
* None required.

## 19. Accessibility
* The `<img>` must have an `alt` tag set to the user's full name (e.g., `alt="Maya's avatar"`).

## 20. Keyboard Interaction
* Usually non-interactive on its own, but often wrapped in a `<button>` to trigger a dropdown menu.

## 21. Responsive Behavior
* Fixed size, does not scale with viewport.

## 22. Dark Mode
* Fallback backgrounds may need adjusting to ensure they don't blend into the dark surface.

## 23. Design Tokens
* `--muted`.

## 24. API Specification
Built using Radix UI `Avatar`.

```tsx
<Avatar>
  <AvatarImage src="url.jpg" alt="@maya" />
  <AvatarFallback>MA</AvatarFallback>
</Avatar>
```

## 25. Props Reference
* `src`: Image URL.
* `alt`: Accessibility text.
* `fallback`: String (e.g., "MA").
* `size`: Enum (sm, default, lg).

## 26. Events
* N/A.

## 27. Composition
* Used within DropdownMenuTrigger, UserCards, and TranscriptSegments.

## 28. AI Usage Guidelines
* The AI itself (MeetingMind) can be represented by a specific, stylized Avatar (e.g., the Sparkles icon on a solid primary background) when it "speaks" in the RAG search.

## 29. Error Handling
* Handled natively by Radix UI (switches to Fallback on `onError`).

## 30. Edge Cases
* Extremely long names: Still extract only the first two initials.

## 31. Performance
* Use Next.js `next/image` inside the AvatarImage component for automatic WebP optimization and resizing if the source images are large.

## 32. Security Considerations
* Ensure avatar URLs are sanitized to prevent XSS if they are user-supplied.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* With Image, With Fallback (No Image), Broken Image Link (tests fallback), Sizes.

## 35. Figma Mapping
* `Core/Avatar`

## 36. shadcn/ui Mapping
* `npx shadcn-ui@latest add avatar`

## 37. Tailwind Mapping
* `relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full`

## 38. Implementation Notes
* Extract the deterministic color generation logic into a utility function `getUserColor(userId)` so the same user always gets the same fallback background color.

## 39. QA Checklist
* Simulate slow network to verify fallback shows before image loads.

## 40. Acceptance Criteria
* Falls back to initials on error.

## 41. Future Enhancements
* Status indicators (green dot for "online").

## 42. CTO Notes
* Standardize the deterministic color hashing algorithm on the frontend so avatars look consistent without needing backend support.
