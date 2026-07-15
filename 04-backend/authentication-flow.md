---
Title: MeetingMind — Backend: Authentication Flow
Version: 1.1.0
Status: Approved
Owner: Lead Security Engineer
Last Updated: 2026-07-10
Dependencies: None
---

# MeetingMind Backend: Authentication & Authorization Flow

## 1. Overview
MeetingMind uses a stateless, token-based authentication system utilizing JSON Web Tokens (JWT). Authorization (RBAC) is enforced at the Workspace level.

## 2. Authentication (AuthN)

### 2.0 Bootstrap and Registration Modes
* **Fresh Deployment:** While there are zero users, registration is in `bootstrap` mode. One atomic transaction creates the first user as Owner, the default workspace, and the Owner membership.
* **Initialized Deployment:** After bootstrap, registration is `invitation_only`. The invitation is single-use, expiring, stored as a hash, and bound to an email, workspace, and proposed role.
* **v1 Workspace Limit:** Users see at most the deployment's one default workspace. Additional workspace creation and switching are deferred to v1.2, even though authorization remains workspace-scoped internally.

### 2.1 Supported Methods
* **Email & Password:** Standard credential hashing using `bcrypt`.
* **OAuth2 (Future):** Google Workspace / Microsoft Entra ID integration (highly requested by enterprise users).

### 2.2 The Login Flow
1. Client sends `POST /auth/login` with credentials.
2. Backend validates credentials.
3. Backend generates two tokens:
   * **Access Token:** Short-lived (e.g., 15 minutes). Contains user ID and basic claims.
   * **Refresh Token:** Long-lived (e.g., 7 days). Stored securely (HttpOnly cookie or secure storage).
4. Client includes the Access Token in the `Authorization: Bearer <token>` header of every subsequent API request.

### 2.3 JWT Claims
The payload of the Access Token should be kept minimal to reduce overhead:
```json
{
  "sub": "user_uuid",
  "exp": 1718293842,
  "type": "access"
}
```

## 3. Authorization (AuthZ) & Multi-Tenancy

MeetingMind uses a multi-tenant-ready storage and authorization model. Users do not have global roles; they have roles *within specific workspaces*. v1 exposes one default workspace per deployment, while v1.2 may expose multiple memberships and workspace switching.

### 3.1 The Context Problem
A user makes a request to `GET /meetings/uuid-123`. How do we know they are allowed to see it?

### 3.2 The Resolution Strategy
1. **Middleware/Dependency Injection:** FastAPI dependencies extract the `user_uuid` from the JWT.
2. **Resource Lookup:** The backend looks up the requested resource (`Meeting`) to find its `workspace_id`.
3. **Membership Check:** The backend queries the `WorkspaceMembership` table: Does `user_uuid` belong to `workspace_id`?
4. **Role Check:** If the action is restricted, the backend evaluates the membership role: `owner`, `admin`, `member`, or `viewer`. Only an Owner may grant/remove Owner or delete the workspace.

### 3.3 FastAPI Dependency Example
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # Decode JWT and return User model
    pass

async def verify_workspace_access(
    workspace_id: UUID, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    membership = await db.get(WorkspaceMembership, (workspace_id, current_user.id))
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    return membership
```

## 4. Security Best Practices
* **Never store Refresh Tokens in LocalStorage.** They are vulnerable to XSS. Use `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
* **Password Hashing:** Use `passlib` with `bcrypt`. Never log plain text passwords.
* **Token Invalidation:** Because JWTs are stateless, they cannot be easily revoked before expiration. If immediate revocation is required (e.g., password reset, compromised account), implement a "Token Blocklist" in Redis, or simply rely on the short 15-minute lifespan of the Access Token.
* **Invitation and Reset Tokens:** Store only cryptographic hashes. Tokens are single-use, expire, can be revoked, and must never be logged or sent to analytics.
* **Password Reset:** Always return the same response for known and unknown emails. A successful reset revokes all refresh tokens for that user.

## 5. API Key Access (Future v1.2 Integration Work)
For developers integrating MeetingMind with Zapier or custom scripts:
* Users can generate Long-Lived API Keys scoped to a specific workspace.
* These keys act as Bearer tokens but have a different prefix (e.g., `mm_live_...`).
* The backend must verify these keys against the database on every request, making them stateful, unlike JWTs. Hash the API keys in the database (like passwords); only show the plain text key to the user once upon creation.

These endpoints are not exposed in v1 and require a dedicated Jira/API contract before implementation.
