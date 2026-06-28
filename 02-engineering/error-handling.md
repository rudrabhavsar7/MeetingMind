---
Title: MeetingMind — Error Handling
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-06-28
Dependencies: 02-engineering/api-design.md
---

# MeetingMind — Error Handling

MeetingMind employs a structured error handling architecture based on RFC 7807 (Problem Details for HTTP APIs). The goal is to provide actionable error messages to the frontend while logging sufficient context for debugging on the backend.

## 1. Backend Error Taxonomy (FastAPI)

We define a hierarchy of custom Python exceptions in the core. The FastAPI exception handlers catch these and translate them into RFC 7807 JSON responses.

### 1.1 Custom Exceptions (`app/core/exceptions.py`)

```python
class AppError(Exception):
    """Base class for all application errors."""
    def __init__(self, message: str, status_code: int, error_type: str):
        self.message = message
        self.status_code = status_code
        self.error_type = error_type
        super().__init__(self.message)

class NotFoundError(AppError):
    def __init__(self, resource: str):
        super().__init__(
            message=f"{resource} not found.",
            status_code=404,
            error_type="not_found"
        )

class AuthorizationError(AppError):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=403,
            error_type="forbidden"
        )
```

### 1.2 Global Exception Handler (`app/main.py`)

We override FastAPI's default exception handlers to ensure every error returns a standard Problem Details envelope.

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppError

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": f"https://api.meetingmind.io/errors/{exc.error_type}",
            "title": exc.__class__.__name__,
            "status": exc.status_code,
            "detail": exc.message,
            "instance": request.url.path,
        },
    )

# Also override RequestValidationError for 422s to match this format
```

## 2. Frontend Error Handling (Next.js & React Query)

The frontend uses Axios interceptors and React Query's `onError` callbacks to handle these structured responses gracefully.

### 2.1 Toast Notifications
Global API errors (like 500s or network failures) should be handled by a global React Query cache configuration that triggers a Toast.

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Assuming axios error format wrapping our RFC 7807 response
      const detail = error.response?.data?.detail || "An unexpected error occurred.";
      toast.error(detail);
    },
  }),
});
```

### 2.2 Form Validation Errors (422)
When the backend returns a 422 Unprocessable Entity, the frontend should attempt to map the errors back to the specific form fields using React Hook Form's `setError`.

```typescript
const onSubmit = async (data) => {
  try {
    await submitForm(data);
  } catch (error) {
    if (error.response?.status === 422) {
      // Backend validation failed. Map errors to fields.
      const validationErrors = error.response.data.errors; // Custom array in our 422 payload
      validationErrors.forEach(err => {
        setError(err.field, { message: err.message });
      });
    } else {
      toast.error(error.response?.data?.detail);
    }
  }
}
```

### 2.3 Error Boundaries (React)
React Error Boundaries catch rendering errors and prevent the entire application from crashing to a white screen.

```tsx
// app/error.tsx (Next.js App Router convention)
"use client"

export default function ErrorBoundary({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h2 className="text-xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
```

## 3. Celery Background Task Errors

Background tasks require special handling because there is no synchronous HTTP request to return the error to.

1. **Catch & Update State:** The task must catch the exception, update the `Meeting` status in PostgreSQL to `FAILED`, and log the stack trace.
2. **Retry Logic:** Transient errors (network timeouts to MinIO) should use Celery's `autoretry_for`.
3. **Notification:** The user should receive a notification (in-app or email) explaining that the processing failed.
