---
Title: MeetingMind — Security Requirements
Version: 1.1.0
Status: Approved
Owner: Lead DevOps & Security
Last Updated: 2026-07-10
Dependencies: 01-product/prd.md
---

# MeetingMind — Security Requirements

This document outlines the security architecture and defensive requirements for MeetingMind to ensure the confidentiality, integrity, and availability of highly sensitive meeting data.

## 1. Threat Model (Simplified)

```mermaid
threatmodel
    title MeetingMind Threat Landscape
    
    Actor User(Employee)
    Actor Admin(Workspace Admin)
    Actor Attacker(External)
    
    System SPA(Next.js App)
    System API(FastAPI)
    System DB(PostgreSQL)
    System Storage(MinIO)
    
    Attacker -- "XSS / Phishing" --> User
    Attacker -- "SQLi / JWT Forgery" --> API
    Attacker -- "Malicious Uploads" --> Storage
    User -- "Unauthorized Access" --> DB
```

## 2. Authentication (AuthN)
* **JWT Implementation:** JSON Web Tokens must be signed using `HS256`. 
* **Token Lifetimes:** 
  * Access Token: 15 minutes. Stored in memory by the SPA.
  * Refresh Token: 7 days. Stored in a `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
* **Secret Management:** JWT secrets and database credentials must never be hardcoded and must be injected via environment variables at runtime.
* **Brute Force Protection:** Login endpoints must enforce rate limiting (max 5 attempts per 15 minutes per IP).
* **First-Run Bootstrap:** Initial Owner/default-workspace creation is allowed only while there are zero users and must be atomic under concurrent requests. After success, public registration closes.
* **Invitation Registration:** Invitation tokens are random, single-use, expiring, revocable, bound to workspace/email/role, and stored only as hashes. Registration must not create membership until the invitation is consumed successfully.
* **Password Reset Privacy:** Forgot-password responses must not reveal whether an account exists. Reset tokens are hashed, single-use, short-lived, and successful reset revokes all refresh sessions.
* **Sensitive Endpoint Limits:** Bootstrap, invitation validation/issuance, forgot-password, and reset attempts require endpoint-specific rate limits in addition to the global API limit.

## 3. Authorization (AuthZ) & RBAC
* **Workspace Isolation:** Every API query fetching data must include `WHERE workspace_id = ?` to prevent cross-tenant data leakage.
* **Roles:**
  * `Owner`: Full control, billing, deletion.
  * `Admin`: Manage members, manage workspace settings.
  * `Member`: Start live meetings, import recordings, edit action items.
  * `Viewer`: Read-only access to transcripts and search.
* **Enforcement:** Enforced at the FastAPI route level using dependency injection (`Depends(require_role("Admin"))`).

## 4. Data Protection
* **In Transit:** All external traffic must be encrypted via TLS 1.2 or 1.3 through the v1 Nginx reverse proxy.
* **At Rest:** Database volumes and MinIO storage volumes should utilize OS-level disk encryption (e.g., LUKS) depending on the host deployment.
* **Passwords:** Hashed using `bcrypt` (work factor 12+).

## 5. Input Validation & Output Encoding
* **Injection Prevention:** FastAPI must use SQLAlchemy ORM parameter binding. Raw SQL string concatenation is strictly prohibited.
* **Validation:** Pydantic models must be used for ALL incoming request bodies, enforcing type, length, and regex constraints.
* **XSS Prevention:** Next.js automatically escapes HTML. Any use of `dangerouslySetInnerHTML` must pipe data through `DOMPurify`.

## 6. Secure Extension Capture and Recording Imports
Because live audio chunks and imported audio/video files are untrusted inputs:
1. **Extension Tokens:** Chrome extension sessions use revocable tokens scoped to a user, default workspace, and browser device, with an eight-hour maximum lifetime.
2. **Authenticated Streams:** Capture WebSockets use 15-minute handshake tokens scoped to user, device, meeting, workspace, and client instance. Expiry does not terminate an accepted socket; reconnect requires a fresh token minted from the revocable eight-hour extension session.
3. **Explicit Consent:** The extension must never auto-start capture. User action and browser tab-audio permission are required.
4. **Chunk Limits:** The backend must enforce audio chunk size, session duration, reconnect limits, and tab/source metadata validation.
5. **Direct Imports:** Imported files are uploaded directly to MinIO via presigned URLs to prevent the Python backend from loading massive payloads into memory.
6. **Type Validation:** The frontend must restrict import file types in the file picker.
7. **Magic Number Check:** The Celery worker must verify imported file signatures (magic bytes) using python-magic before passing them to FFmpeg, rejecting disguised executables.
8. **Sanitization:** FFmpeg process must run with restricted privileges and time limits to prevent resource exhaustion attacks via malformed media files.
9. **Manifest V3 Isolation:** Raw audio and extension/session tokens live only in the offscreen document/service worker contexts and are never exposed to meeting-page content scripts or DOM-injected code.
10. **Bounded Replay:** Reconnect audio is memory-only and capped at 60 seconds. It must never be written to `chrome.storage`; overflow becomes an explicit `audio_gap`.
11. **WebSocket Origin and Logging:** Production accepts only configured console origins and extension IDs. Handshake tokens should use `Sec-WebSocket-Protocol` where possible and must be redacted from proxy/application logs when query fallback is used.
12. **Protocol Limits:** Enforce protocol version, 16,020-byte maximum frame size, heartbeat timeout, one active producer per meeting/client instance, rate limits, and the eight-hour live-session maximum.

## 7. OWASP Top 10 Mitigations

| Vulnerability | MeetingMind Mitigation |
|---|---|
| **Broken Access Control** | Workspace ID enforced on all ORM queries; strict Role dependency injection in API. |
| **Cryptographic Failures** | TLS 1.3 mandated; bcrypt for passwords; no custom crypto. |
| **Injection** | SQLAlchemy parameterized queries; strict Pydantic validation. |
| **Insecure Design** | Security shift-left; threat modeling during architecture phase. |
| **Security Misconfiguration** | Hardened immutable containers; private Compose networks; least-privilege service credentials and optional cloud IAM. |

## 8. Audit Logging
* Critical actions must generate immutable audit logs stored in a dedicated database table:
  * User login/logout
  * Member role changes
  * Meeting deletions
  * Failed authentication attempts
  * Invitation creation, revocation, acceptance, and failed acceptance
  * Password reset completion and refresh-session revocation
* Logs must include: Timestamp, UserID, Action, IP Address, ResourceID.
