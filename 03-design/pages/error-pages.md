---
Title: MeetingMind — Error Pages
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 02-engineering/error-handling.md
---

# MeetingMind — Error Pages (`app/error.tsx`, `app/global-error.tsx`)

Error pages catch unhandled exceptions during React rendering or Next.js server-side data fetching. They are the last line of defense against the "White Screen of Death".

## 1. Page Purpose
To prevent catastrophic UI crashes, inform the user something went wrong technically, and provide a way to recover.

## 2. Types of Error Boundaries

### 2.1 Route Error Boundary (`app/error.tsx`)
Catches errors within a specific route segment (e.g., inside `/meetings`). 
* **Layout:** This boundary *preserves* the App Shell (Sidebar/Header). The error UI replaces only the main content area.
* **Content:**
  * Icon: `AlertTriangle` (Rose color).
  * Headline: "Something went wrong loading this view."
  * Body: `error.message` (in development) or a generic apology (in production).
  * Action: "Try Again" Button. This button calls the `reset()` function provided by Next.js to attempt re-rendering the segment.

### 2.2 Global Error Boundary (`app/global-error.tsx`)
Catches errors at the absolute root of the application (e.g., if the root layout fails to render because the main CSS bundle is corrupt).
* **Layout:** Full bare-bones HTML page. It *cannot* rely on standard layouts.
* **Content:** Very minimal "Critical Application Error" screen with a hard "Reload Page" button (`window.location.reload()`).

## 3. Implementation Example

```tsx
'use client' // Error boundaries must be Client Components
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        We encountered an unexpected error while rendering this page. 
      </p>
      <Button variant="outline" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
}
```
