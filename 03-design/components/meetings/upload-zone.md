---
Title: MeetingMind — Component: Recording Import Zone
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/foundation/progress.md
---

# MeetingMind Component: Recording Import Zone

## 1. Overview
A large, interactive drag-and-drop area for users to import existing audio and video meeting recordings as a fallback/backfill flow.

## 2. Design Philosophy
Importing historical recordings should be frictionless and visually obvious. The area should be inviting and clearly state what formats are accepted.

## 3. Problem Statement
Small "Choose File" buttons are easily missed and provide poor feedback during long recording imports.

## 4. UX Goals
* Clear drag-and-drop affordance.
* Real-time import progress feedback.
* Clear error handling (wrong format, file too large).

## 5. Usage Guidelines
* Prominently displayed on the `/meetings/import` fallback page.

## 6. When to Use
* Importing historical meeting recordings or recordings from unsupported meeting apps.

## 7. When NOT to Use
* For small image uploads (Use a standard file input).

## 8. Component Anatomy
* Container (Dashed border, large padding).
* Icon (`UploadCloud`).
* Primary Text ("Drag & drop files here").
* Secondary Text ("Supports MP3, MP4, WAV up to 2GB").
* Manual Trigger Button ("Browse Files").
* Hidden `<input type="file">`.

## 9. Variants
* **Idle:** Standard dashed border.
* **Drag Active:** Solid primary border, slightly scaled up, background tint.
* **Uploading:** Replaces content with a Progress bar.

## 10. Sizes
* `w-full min-h-[300px]`.

## 11. States
* Idle, Drag Active, Uploading, Success, Error.

## 12. Layout Rules
* Centered flexbox layout.

## 13. Content Guidelines
* Always explicitly state file size limits to prevent user frustration.

## 14. Icon Rules
* Huge `UploadCloud` icon (`h-12 w-12`).

## 15. Color System
* Idle border: `border-muted-foreground/25`.
* Drag Active border: `border-primary bg-primary/5`.

## 16. Typography
* Text: `text-lg font-medium`.

## 17. Spacing
* Padding `p-12`.

## 18. Motion
* Smooth transition on drag enter/leave.

## 19. Accessibility
* The "Browse Files" button must be keyboard focusable and trigger the hidden input.
* `aria-describedby` should link to the supported formats text.

## 20. Keyboard Interaction
* Enter/Space on the button opens the OS file picker.

## 21. Responsive Behavior
* Shrinks height on mobile.

## 22. Dark Mode
* Adjust dashed border opacity for contrast.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<div 
  className={cn(
    "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
  )}
>
  <UploadCloud className="mb-4 h-12 w-12 text-muted-foreground" />
  <h3 className="text-lg font-semibold">Drag & drop your meeting recording</h3>
  <p className="mb-4 text-sm text-muted-foreground">Supports MP4, MP3, WAV up to 2GB</p>
  <Button>Browse Files</Button>
</div>
```

## 25. Props Reference
* `onUpload`, `accept`, `maxSize`.

## 26. Events
* `onDragEnter`, `onDragLeave`, `onDrop`, `onChange` (input).

## 27. Composition
* Uses Button, Icons.

## 28. AI Usage Guidelines
* N/A (Pre-pipeline component).

## 29. Error Handling
* Display red text/toast if file is too large *before* attempting the network upload.

## 30. Edge Cases
* User drops multiple files when only single upload is supported.

## 31. Performance
* Ensure the browser doesn't lock up when selecting a massive 4GB video file (use async chunking for the actual upload logic).

## 32. Security Considerations
* Validate MIME types on the frontend, but **must** also validate on the backend to prevent malicious uploads.

## 33. Analytics Events
* Track upload successes vs failures (due to size/format).

## 34. Storybook Stories
* Idle, Dragging, Uploading (with progress bar).

## 35. Figma Mapping
* `Meetings/UploadZone`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `border-dashed`.

## 38. Implementation Notes
* Use `react-dropzone` for robust cross-browser drag-and-drop handling. It manages all the complex drag state event bubbling.

## 39. QA Checklist
* Drag a file OUTSIDE the dropzone and ensure the browser doesn't accidentally open/play the file, replacing the app.

## 40. Acceptance Criteria
* Intuitively accepts files via drag-and-drop or click.

## 41. Future Enhancements
* S3 Direct Upload (Presigned URLs) to bypass backend memory limits.

## 42. CTO Notes
* Do not pipe large video files through the FastAPI backend memory. The UI must request a Presigned URL from the backend and PUT the file directly to S3/Cloud Storage.
