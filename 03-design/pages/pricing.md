---
Title: MeetingMind — Pricing Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind — Pricing Page

*Note: MeetingMind v1.0 is an open-source/source-available self-hosted product. There is no in-app billing or subscription management required for the core deployment.*

## 1. Scope

Because the application is deployed entirely on the customer's infrastructure (VPS, AWS, on-prem), there are no recurring SaaS fees charged through the application itself.

Therefore, **no `/pricing` or `/billing` pages exist within the MeetingMind application dashboard.**

## 2. Future Considerations (v2.0+)

If a managed cloud offering (SaaS) or an Enterprise License Key system is introduced in the future:

* **Location:** Billing management would live under `/settings/workspace/billing`.
* **Provider:** Stripe Elements integration.
* **Layout:**
  * Current Plan summary card (e.g., "Enterprise License").
  * Usage progress bars (if quota-based: e.g., "150/500 hours transcribed this month").
  * Invoice history data table.

For v1.0 development, this entire section is out of scope.
