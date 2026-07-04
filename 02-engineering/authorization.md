---
Title: MeetingMind — Authorization (RBAC)
Version: 1.0.0
Status: Approved
Owner: Lead DevOps & Security
Last Updated: 2026-06-28
Dependencies: 02-engineering/authentication.md
---

# MeetingMind — Authorization (RBAC)

MeetingMind employs a Role-Based Access Control (RBAC) system. Authorization guarantees that an authenticated user actually has permission to perform a specific action on a specific resource within a specific workspace.

## 1. Roles & Permissions Matrix

In MeetingMind v1.0, roles are scoped at the **Workspace** level. A user can have different roles in different workspaces (once multi-workspace is supported).

| Action / Resource | Owner | Admin | Member | Viewer |
|---|:---:|:---:|:---:|:---:|
| Read Meetings & Transcripts | ✅ | ✅ | ✅ | ✅ |
| Start Extension Capture / Import Meetings | ✅ | ✅ | ✅ | ❌ |
| Delete Meetings | ✅ | ✅ | ❌ | ❌ |
| Update Action Items | ✅ | ✅ | ✅ | ❌ |
| Use AI Search | ✅ | ✅ | ✅ | ✅ |
| Manage Roles/Members | ✅ | ✅ | ❌ | ❌ |
| Delete Workspace | ✅ | ❌ | ❌ | ❌ |

## 2. FastAPI Dependency Injection

FastAPI's `Depends` mechanism is the standard way to enforce authorization at the route level. We implement a closure factory `require_role` that returns a dependency.

```python
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.api.dependencies import get_current_user
from enum import IntEnum

class Role(IntEnum):
    VIEWER = 1
    MEMBER = 2
    ADMIN = 3
    OWNER = 4

def require_role(required_role: Role):
    async def role_checker(
        workspace_id: str, # Usually passed in header or path
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        # Fetch user's role in this specific workspace
        user_workspace = await db.execute(
            select(UserWorkspace)
            .where(UserWorkspace.user_id == user.id)
            .where(UserWorkspace.workspace_id == workspace_id)
        )
        uw = user_workspace.scalar_one_or_none()
        
        if not uw:
            raise HTTPException(status_code=403, detail="Not a member of this workspace")
            
        if uw.role < required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
            
        return user
    return role_checker
```

### Usage in a Route

```python
@router.post("/meetings", response_model=MeetingResponse)
async def create_meeting(
    payload: MeetingCreate,
    workspace_id: str = Header(...),
    # Enforce that the user is at least a MEMBER
    user: User = Depends(require_role(Role.MEMBER)) 
):
    # Route logic...
```

## 3. Resource-Level Authorization

Sometimes, role-based checks aren't enough; you need to check if a user owns a specific resource. (e.g., A Member can delete *their own* comments, but not others').

This logic should live in the **Service Layer**, not the API routing layer.

```python
# app/services/comment_svc.py

async def delete_comment(db: AsyncSession, comment_id: str, current_user: User):
    comment = await get_comment(db, comment_id)
    if not comment:
        raise NotFoundError()
        
    # Resource ownership check
    if comment.author_id != current_user.id and current_user.role < Role.ADMIN:
        raise ForbiddenError("Cannot delete someone else's comment")
        
    await db.delete(comment)
    await db.commit()
```

## 4. Frontend Authorization (Next.js)

The frontend should hide or disable UI elements that the user cannot interact with based on their role.

*Note: Frontend hiding is for UX purposes only. The backend MUST always strictly enforce the rules.*

```tsx
// hooks/use-permissions.ts
import { useUserStore } from '@/stores/user-store';

export function useCanCaptureMeeting() {
  const role = useUserStore((state) => state.currentWorkspaceRole);
  return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
}

// In a component:
const canCaptureMeeting = useCanCaptureMeeting();

return (
  <div>
    {canCaptureMeeting && <Button>Connect Extension</Button>}
  </div>
);
```

## 5. Anti-Patterns to Avoid
* ❌ **Hardcoding Workspace IDs:** Never query `SELECT * FROM meetings WHERE id = ?` without also including `AND workspace_id = ?`.
* ❌ **Client-Side Trust:** Never trust a role claim submitted by the frontend payload (e.g., `{"role": "admin"}`). Always derive the role from the database using the JWT `sub`.
