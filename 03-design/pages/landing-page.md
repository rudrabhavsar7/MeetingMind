---
Title: MeetingMind — Landing Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind — Landing Page (`/`)

*Note: Since MeetingMind v1.0 is an internal, self-hosted enterprise tool, a traditional "Marketing Landing Page" is not strictly required. The root route (`/`) will typically redirect unauthenticated users directly to `/login`.*

## 1. Internal Marketing (Optional)

If a deployment chooses to serve a landing page at `/` to educate internal employees before they log in, it should be minimal.

### Layout Structure
* **Header:** MeetingMind Logo (Left). "Login" Button (Right).
* **Hero Section:**
  * Headline: "Your Organization's AI Meeting Oracle."
  * Subheadline: "Upload recordings. Get instant summaries, extracted action items, and a searchable knowledge base—all kept 100% private on our own servers."
  * CTA Button: "Sign In via SSO" (or standard login).
  * Graphic: A stylized, dark-mode dashboard mockup or a 3D isometric representation of a server rack with AI nodes.
* **Features (3-Column Grid):**
  1. *Total Privacy:* "No data leaves our VPC."
  2. *Instant Clarity:* "Automated meeting minutes and decisions."
  3. *Ask Anything:* "Query past meetings with RAG."

## 2. Redirection Logic (Default Behavior)

By default, the Next.js `middleware.ts` handles the root route:
1. If no valid session token exists: `Redirect -> /login`
2. If valid session token exists: `Redirect -> /dashboard`
