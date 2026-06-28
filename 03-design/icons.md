---
Title: MeetingMind — Icons
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind — Icons

MeetingMind relies on **Lucide React** (`lucide-react`) as its singular icon library. Lucide provides clean, consistent, stroke-based SVGs that perfectly match our professional, content-first aesthetic.

## 1. Sizing

Icons should generally match the line-height of the text they are paired with, or be explicitly sized for specific UI regions (like sidebars).

| Tailwind Class | Pixel Size | Usage |
|---|---|---|
| `w-4 h-4` | 16x16px | Inline with standard text (`text-sm` or `text-base`). Inside standard buttons. |
| `w-5 h-5` | 20x20px | Sidebar navigation links. Section headers. |
| `w-6 h-6` | 24x24px | Empty states, major application icons. |
| `w-8 h-8` | 32x32px | Marketing sections or large drag-and-drop zones. |

## 2. Stroke Width

Lucide defaults to a stroke width of `2px`. This should be maintained globally.
If an icon is scaled up significantly (e.g., `w-12 h-12` in an empty state), the stroke width can be reduced to `1.5px` to prevent it from looking overly heavy.

```tsx
import { UploadCloud } from "lucide-react";

// Standard
<UploadCloud className="w-4 h-4" />

// Large (adjusted stroke)
<UploadCloud className="w-12 h-12" strokeWidth={1.5} />
```

## 3. Semantic Icon Mapping

To ensure consistency, specific concepts must always use the same icon. Do not mix and match.

### 3.1 Core Navigation
* **Dashboard:** `LayoutDashboard`
* **Meetings:** `Video`
* **Action Items:** `CheckSquare`
* **AI Search:** `Sparkles`
* **Settings:** `Settings`

### 3.2 Actions
* **Upload/Add:** `Plus` or `Upload`
* **Edit:** `Pencil`
* **Delete:** `Trash2` (Always colored `--destructive` on hover)
* **Play Audio:** `Play`
* **Pause Audio:** `Pause`
* **Copy:** `Copy` (Swap to `Check` briefly upon successful copy)
* **Export:** `Download`

### 3.3 Status & Feedback
* **Success:** `CheckCircle2` (Emerald)
* **Warning / Low Confidence:** `AlertTriangle` (Amber)
* **Error:** `XCircle` (Rose)
* **Loading / Processing:** `Loader2` (with `animate-spin` class)

## 4. Accessibility (a11y)

* **Decorative Icons:** If an icon is purely decorative and accompanied by text (e.g., a button that says "Upload" with an upload icon), the icon must be hidden from screen readers. (Note: Lucide React usually handles this automatically by omitting the `title` tag, but adding `aria-hidden="true"` is safest).
* **Standalone Icons:** If a button *only* contains an icon (e.g., a trash can button), it MUST have a screen-reader-only span or an `aria-label`.

```tsx
// ✅ GOOD: Standalone icon button
<Button size="icon" variant="ghost" aria-label="Delete meeting">
  <Trash2 className="w-4 h-4" aria-hidden="true" />
</Button>

// ✅ GOOD: Icon paired with text
<Button>
  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
  Upload Meeting
</Button>
```
