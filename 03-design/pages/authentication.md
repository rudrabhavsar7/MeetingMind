---
Title: MeetingMind — Authentication Pages
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/layouts.md
---

# MeetingMind — Authentication Pages (`/login`, `/register`)

The Auth pages are the first impression of MeetingMind. They must feel secure, fast, and enterprise-ready.

## 1. Page Purpose
To securely authenticate existing users or onboard new users invited to a workspace.

## 2. Layout Structure (Full-Screen Focus)

* **Background:** A split design.
  * **Left Side (50vw):** A subtle, branded visual (e.g., a dark slate background with a very subtle, slow-moving abstract node network or abstract waveform). Hidden on mobile.
  * **Right Side (50vw):** Solid white (`bg-background`). Centered vertically and horizontally is the authentication card.
* **The Auth Card:** `max-w-sm w-full p-8`.

## 3. Components & Forms

### 3.1 Login Form (`/login`)
* **Header:** MeetingMind Logo, Title "Welcome back", Subtitle "Enter your details to sign in".
* **Fields:**
  * Email (Input type="email", autocomplete="username").
  * Password (Input type="password", autocomplete="current-password").
* **Actions:**
  * "Forgot password?" (Link, right-aligned above password field).
  * "Sign In" (Primary Button, full width).
* **Footer:** "Don't have an account? Contact your administrator." (Since v1.0 is invite-only for new workspaces).

### 3.2 Registration Form (`/register`)
* *Used when a user clicks an invite link.*
* **Fields:**
  * Full Name.
  * Email (Pre-filled and disabled, based on invite token).
  * Password.
  * Confirm Password.
* **Validation (Inline):** Password strength meter (Length, Number, Special Char) updates dynamically as the user types.

## 4. Interaction & Feedback

* **Submit State:** The "Sign In" button text changes to a spinner and "Signing in..." to prevent double-clicks.
* **Error State:** If credentials are wrong, the input borders turn red (`border-destructive`), and a red text block appears above the form: "Invalid email or password."
* **Success State:** Instant redirect to `/dashboard`.

## 5. Security UX
* Do not auto-focus the password field if the email is invalid.
* Provide a "Show/Hide Password" toggle (eye icon) inside the password input fields.
