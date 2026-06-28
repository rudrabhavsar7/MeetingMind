---
Title: MeetingMind — Motion & Animation
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/experience-tokens.md
---

# MeetingMind — Motion & Animation

Motion in MeetingMind is functional, not decorative. It serves to guide attention, confirm actions, and mask loading times. We use **Framer Motion** for complex layout animations and **Tailwind CSS transitions** for simple state changes (hover, focus).

## 1. Core Principles

1. **Fast:** Enterprise users value speed over spectacle. Most transitions should finish in under `200ms`.
2. **Intentional:** Animation must explain a state change (e.g., an accordion expanding explains that hidden content is now visible).
3. **Accessible:** Respect `prefers-reduced-motion` at the OS level (see [Accessibility](accessibility.md)).

## 2. Transition Tokens (Tailwind)

For simple hover states and color changes, use Tailwind's built-in transition utilities.

| Tailwind Class | Duration | Usage |
|---|---|---|
| `transition-colors duration-200` | 200ms | Button hovers, link color changes. |
| `transition-opacity duration-300` | 300ms | Fading in tooltips or toasts. |
| `transition-transform duration-300 ease-out` | 300ms | Small scale bumps (e.g., card hover) or slide-ins. |

## 3. Framer Motion Implementation

For complex mount/unmount animations and layout shifts, we use `framer-motion`.

### 3.1 Fade In / Mount
Used when data loads or a page transition occurs.

```tsx
import { motion } from "framer-motion";

export const FadeIn = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);
```

### 3.2 List Orchestration (Staggering)
When loading a list of items (like Meeting Cards), stagger their entrance to create a cascading effect rather than having them all pop in simultaneously.

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 100ms delay between each child
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Implementation...
<motion.ul variants={container} initial="hidden" animate="show">
  {meetings.map(m => (
    <motion.li key={m.id} variants={item}>
      <MeetingCard {...m} />
    </motion.li>
  ))}
</motion.ul>
```

### 3.3 Layout Animations (`layout` prop)
When the DOM structure changes (e.g., an Action Item is checked off and removed from the list), the remaining items should smoothly slide into their new positions rather than instantly snapping.

```tsx
<motion.li layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
  <ActionItemCard />
</motion.li>
```

## 4. Skeleton Loading (Pulse)

To mask latency during RAG search or transcription fetching, use the `animate-pulse` utility. The skeleton should roughly match the shape of the expected content.

```tsx
export function MeetingCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="h-5 bg-muted animate-pulse rounded w-1/3"></div>
      <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
      <div className="flex gap-2 pt-2">
        <div className="h-6 w-16 bg-muted animate-pulse rounded-full"></div>
      </div>
    </div>
  );
}
```
