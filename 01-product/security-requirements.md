---
Title: MeetingMind — Security Requirements
Version: 1.0.0
Status: Approved
Owner: Lead DevOps & Security
Last Updated: 2026-06-28
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

## 3. Authorization (AuthZ) & RBAC
* **Workspace Isolation:** Every API query fetching data must include `WHERE workspace_id = ?` to prevent cross-tenant data leakage.
* **Roles:**
  * `Owner`: Full control, billing, deletion.
  * `Admin`: Manage members, manage workspace settings.
  * `Member`: Upload meetings, edit action items.
  * `Viewer`: Read-only access to transcripts and search.
* **Enforcement:** Enforced at the FastAPI route level using dependency injection (`Depends(require_role("Admin"))`).

## 4. Data Protection
* **In Transit:** All external traffic must be encrypted via TLS 1.2 or 1.3 (handled by Traefik/Nginx reverse proxy).
* **At Rest:** Database volumes and MinIO storage volumes should utilize OS-level disk encryption (e.g., LUKS) depending on the host deployment.
* **Passwords:** Hashed using `bcrypt` (work factor 12+).

## 5. Input Validation & Output Encoding
* **Injection Prevention:** FastAPI must use SQLAlchemy ORM parameter binding. Raw SQL string concatenation is strictly prohibited.
* **Validation:** Pydantic models must be used for ALL incoming request bodies, enforcing type, length, and regex constraints.
* **XSS Prevention:** Next.js automatically escapes HTML. Any use of `dangerouslySetInnerHTML` must pipe data through `DOMPurify`.

## 6. Secure File Uploads
Because audio/video files are untrusted inputs:
1. **Direct Uploads:** Files are uploaded directly to MinIO via presigned URLs to prevent the Python backend from loading massive payloads into memory.
2. **Type Validation:** The frontend must restrict file types in the file picker.
3. **Magic Number Check:** The Celery worker must verify the file signature (magic bytes) using python-magic before passing it to FFmpeg, rejecting disguised executables.
4. **Sanitization:** FFmpeg process must run with restricted privileges and time limits to prevent resource exhaustion attacks via malformed media files.

## 7. OWASP Top 10 Mitigations

| Vulnerability | MeetingMind Mitigation |
|---|---|
| **Broken Access Control** | Workspace ID enforced on all ORM queries; strict Role dependency injection in API. |
| **Cryptographic Failures** | TLS 1.3 mandated; bcrypt for passwords; no custom crypto. |
| **Injection** | SQLAlchemy parameterized queries; strict Pydantic validation. |
| **Insecure Design** | Security shift-left; threat modeling during architecture phase. |
| **Security Misconfiguration** | Immutable Docker containers; least privilege IAM policies (if deployed to AWS). |

## 8. Audit Logging
* Critical actions must generate immutable audit logs stored in a dedicated database table:
  * User login/logout
  * Member role changes
  * Meeting deletions
  * Failed authentication attempts
* Logs must include: Timestamp, UserID, Action, IP Address, ResourceID.
