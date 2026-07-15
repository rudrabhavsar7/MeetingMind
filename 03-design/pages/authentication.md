---
Title: MeetingMind — Authentication Pages
Version: 1.1.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-07-10
Dependencies: 03-design/layouts.md
---

# MeetingMind — Authentication Pages (`/login`, `/register`, `/forgot-password`)

The Auth pages are the first impression of MeetingMind. They must feel secure, fast, and enterprise-ready.

## 1. Page Purpose
To bootstrap the first Owner on a fresh deployment, authenticate existing users, and onboard later users through invitations. Public self-registration is unavailable after bootstrap.

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
* **Footer:** "Need access? Contact your workspace administrator." After bootstrap there is no public sign-up link.

### 3.2 Registration Form (`/register`)
* The route reads `GET /auth/bootstrap-status` before rendering.
* When setup is required, it renders the first-run Owner and workspace form described in `03-design/pages/onboarding.md`.
* After setup, it renders only when a valid invitation token is present. Invalid, expired, revoked, or already-used invitations show a non-destructive error state and a link back to Login.
* **Fields:**
  * Full Name.
  * Email (Pre-filled and disabled, based on invite token).
  * Password.
  * Confirm Password.
* **Validation (Inline):** Password strength meter (Length, Number, Special Char) updates dynamically as the user types.

### 3.3 Forgot and Reset Password (`/forgot-password`, `/reset-password`)
* The forgot-password form accepts an email and always shows the same success message, whether or not the account exists.
* The reset form requires a valid single-use token and a new password plus confirmation.
* Expired, revoked, or already-used tokens show an error without revealing account details.

## 4. Interaction & Feedback

* **Submit State:** The "Sign In" button text changes to a spinner and "Signing in..." to prevent double-clicks.
* **Error State:** If credentials are wrong, the input borders turn red (`border-destructive`), and a red text block appears above the form: "Invalid email or password."
* **Success State:** Instant redirect to `/dashboard`.
* **Bootstrap Race State:** If another operator completes setup first, the losing request returns to Login and explains that initialization has already completed.

## 5. Security UX
* Do not auto-focus the password field if the email is invalid.
* Provide a "Show/Hide Password" toggle (eye icon) inside the password input fields.
* Never reveal whether an email exists through login, invitation, or password-reset errors.
* Invitation and reset tokens must be removed from visible URLs after the page exchanges them for server state where practical, and must never be sent to analytics or logs.
