---
Title: MeetingMind — Coding Standards
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-06-28
Dependencies: None
Related Documents:
  - 02-engineering/naming-conventions.md
  - 02-engineering/folder-structure.md
---

# MeetingMind — Coding Standards

This document establishes the baseline coding standards for all MeetingMind repositories. Adherence to these standards is enforced via CI pipelines (ESLint, Prettier, Ruff, MyPy) and code reviews.

## 1. General Principles
* **DRY (Don't Repeat Yourself):** Extract repeated logic, but avoid premature abstraction. Duplicate code is cheaper than the wrong abstraction.
* **SOLID:** Prioritize single responsibility and composition over inheritance.
* **Fail Fast:** Validate inputs at the boundary. Throw explicit errors early rather than passing invalid state deeper into the application.

## 2. TypeScript & Next.js (Frontend)

### 2.1 TypeScript Strictness
* **No `any`:** Use `unknown` if the type is truly dynamic, then use type guards.
* **Interfaces vs Types:** Use `type` for unions/intersections and `interface` for object shapes.
* **Strict Null Checks:** Always handle `null` and `undefined` explicitly.

```typescript
// ❌ BAD
const processUser = (user: any) => {
  if (user.id) return user.name;
};

// ✅ GOOD
interface User {
  id: string;
  name: string;
}

const processUser = (user: unknown): string | null => {
  if (isUser(user)) {
    return user.name;
  }
  return null;
};

// Type guard
const isUser = (val: unknown): val is User => {
  return typeof val === 'object' && val !== null && 'id' in val && 'name' in val;
};
```

### 2.2 React Components
* **Functional Only:** Class components are forbidden.
* **Server Components Default:** In App Router, components are React Server Components (RSC) by default. Only add `"use client"` when interactivity (useState, onClick) is required.
* **Prop Destructuring:** Destructure props in the function signature.

```tsx
// ❌ BAD (Client component when not needed, props not destructured)
"use client"
export default function MeetingCard(props: { title: string }) {
  return <div>{props.title}</div>;
}

// ✅ GOOD (RSC, destructured)
interface MeetingCardProps {
  title: string;
}

export default function MeetingCard({ title }: MeetingCardProps) {
  return <div className="p-4 rounded-lg bg-card">{title}</div>;
}
```

### 2.3 Custom Hooks
* Extract complex `useState` and `useEffect` logic into custom hooks.
* Hooks must always return a stable reference (use `useCallback` / `useMemo` where appropriate to prevent unnecessary re-renders).

```typescript
// ✅ GOOD
export function useMeetingTimer(startTime: Date) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime.getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return elapsed;
}
```

## 3. Python & FastAPI (Backend)

### 3.1 Type Hints
* Python code MUST be fully typed. MyPy runs in strict mode in CI.

```python
# ❌ BAD
def process_audio(file_path):
    return True

# ✅ GOOD
from pathlib import Path

def process_audio(file_path: Path) -> bool:
    if not file_path.exists():
        raise FileNotFoundError(f"Audio file {file_path} not found.")
    return True
```

### 3.2 Pydantic Models
* Use Pydantic V2 for all data validation and settings management.
* Separate incoming schemas (requests) from outgoing schemas (responses).

```python
# ✅ GOOD
from pydantic import BaseModel, ConfigDict, Field

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)

class MeetingCreate(MeetingBase):
    pass

class MeetingResponse(MeetingBase):
    id: str
    status: str
    
    model_config = ConfigDict(from_attributes=True) # Allows ORM mapping
```

### 3.3 Dependency Injection in FastAPI
* Use FastAPI's `Depends` for reusable logic like authentication, database sessions, and pagination.

```python
# ✅ GOOD
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/meetings")
async def list_meetings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await meeting_service.get_all_for_user(db, user.id)
```

### 3.4 Error Handling
* Do not return generic `500` errors for business logic failures. Raise custom `HTTPException` subclasses.

```python
# ✅ GOOD
from fastapi import HTTPException, status

def verify_ownership(meeting: Meeting, user_id: str) -> None:
    if meeting.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this meeting."
        )
```
