---
Title: MeetingMind — Naming Conventions
Version: 1.0.0
Status: Approved
Owner: Principal Software Architect
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind — Naming Conventions

Consistent naming is critical for codebase readability and grep-ability. This document defines the strict naming rules across the MeetingMind stack.

## 1. File & Folder Naming

### Frontend (Next.js)
| Artifact Type | Convention | Example | Notes |
|---|---|---|---|
| Folders | `kebab-case` | `meeting-details/` | All folders are lowercase. |
| React Components | `PascalCase.tsx` | `MeetingCard.tsx` | Exported component must match filename. |
| Next.js Pages/Layouts | `kebab-case.tsx` | `page.tsx`, `layout.tsx` | Next.js reserved filenames. |
| Hooks | `camelCase.ts` | `useAuth.ts` | Must start with `use`. |
| Utilities/Helpers | `camelCase.ts` | `formatDate.ts` | |
| Types/Interfaces | `*.types.ts` | `meeting.types.ts` | |
| Tests | `*.test.ts(x)` | `MeetingCard.test.tsx`| |

### Backend (Python)
| Artifact Type | Convention | Example | Notes |
|---|---|---|---|
| Folders (Packages) | `snake_case` | `user_management/` | Standard Python module naming. |
| Modules (Files) | `snake_case.py` | `auth_svc.py` | |
| Pytest Files | `test_*.py` | `test_auth.py` | Required for Pytest discovery. |

---

## 2. Code Level Naming (TypeScript)

| Construct | Convention | Example |
|---|---|---|
| Variables/Constants | `camelCase` | `const activeMeetingId = "123";` |
| Global Constants | `UPPER_SNAKE` | `const MAX_UPLOAD_SIZE = 2048;` |
| Functions | `camelCase` (Verb first)| `function fetchMeeting() { ... }` |
| Booleans | `is`, `has`, `should` | `const isProcessing = true;` |
| Interfaces / Types | `PascalCase` | `interface UserProfile { ... }` |
| Enums | `PascalCase` | `enum MeetingStatus { QUEUED, DONE }` |

---

## 3. Code Level Naming (Python)

| Construct | Convention | Example | Notes |
|---|---|---|---|
| Variables | `snake_case` | `meeting_id = "123"` | |
| Constants | `UPPER_SNAKE` | `MAX_RETRIES = 3` | |
| Functions / Methods | `snake_case` | `def extract_audio():` | |
| Classes | `PascalCase` | `class MeetingService:` | |
| Pydantic Models | `PascalCase` + Suffix | `class MeetingCreate(BaseModel):` | Suffix indicates usage (`Create`, `Update`, `Response`). |
| Exceptions | `PascalCase` + `Error` | `class AudioExtractionError(Exception):` | |

---

## 4. Database Naming (PostgreSQL)

| Construct | Convention | Example | Notes |
|---|---|---|---|
| Tables | `snake_case` (Plural) | `users`, `action_items` | Plural represents a collection of records. |
| Columns | `snake_case` | `created_at`, `owner_id` | |
| Primary Keys | `id` | `id` | Type is usually UUID. |
| Foreign Keys | `[table_singular]_id` | `meeting_id` | |
| Join Tables | `[table1]_[table2]` | `users_workspaces` | Alphabetical order preferred. |
| Indexes | `idx_[table]_[column]` | `idx_meetings_status` | |
| Foreign Key Const | `fk_[table]_[ref]` | `fk_actions_meeting` | |

---

## 5. API & Infrastructure Naming

### 5.1 REST API Routes
* URLs must use `kebab-case` and be plural nouns.
* **✅ GOOD:** `/api/v1/action-items`
* **❌ BAD:** `/api/v1/actionItems`, `/api/v1/Action_Items`, `/api/v1/get_actions`

### 5.2 Environment Variables
* Must use `UPPER_SNAKE_CASE`.
* Prefix with application/service name if ambiguous.
* **✅ GOOD:** `POSTGRES_USER`, `NEXT_PUBLIC_API_URL`
* **❌ BAD:** `dbUser`, `apiUrl`

### 5.3 CSS / Tailwind Classes
* Custom classes (if needed) use `kebab-case`.
* **✅ GOOD:** `animate-fade-in`, `bg-card-hover`
