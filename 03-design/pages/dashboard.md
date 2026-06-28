---
Title: MeetingMind — Dashboard Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 01-product/information-architecture.md
---

# MeetingMind — Dashboard Page (`/dashboard`)

The Dashboard is the landing zone for authenticated users. It provides an at-a-glance overview of their responsibilities and recent organizational activity.

## 1. Page Purpose
To immediately answer two questions for the user:
1. What do I need to do? (My Action Items)
2. What did I miss? (Recent Meetings)

## 2. Layout Structure

* **Header:** "Welcome back, [Name]". Includes a primary "Upload Meeting" CTA button.
* **Top Row (Metrics Cards):** 
  * "Action Items Due Soon" (count)
  * "Meetings Processed This Week" (count)
  * "Hours Saved via AI" (calculated metric)
* **Main Split:**
  * **Left Column (60% width):** "Recent Meetings" Feed.
  * **Right Column (40% width):** "My Action Items" Tracker.

## 3. Component Breakdown

### 3.1 Recent Meetings Feed
* Displays the 5 most recently processed meetings in the workspace.
* Uses the `MeetingCard` component.
* States:
  * **Loading:** `MeetingCardSkeleton` (x3).
  * **Empty:** "No meetings processed yet. [Upload your first meeting]".
  * **Error:** Standard error boundary with retry button.
* Includes a "View All Meetings" link at the bottom navigating to `/meetings`.

### 3.2 My Action Items Tracker
* A focused list of open tasks assigned to the current user.
* Uses the `ActionItemRow` component.
* Allows inline checking off (marking complete).
* **Sorting:** Ordered by Due Date (closest first).
* **Empty State:** A cheerful illustration: "You're all caught up!"

## 4. Responsive Behavior

* **Mobile (`< lg`):** The layout stacks vertically. Metrics Row -> My Action Items -> Recent Meetings.
* **Tablet (`md`):** Metrics row uses a 3-column grid.

## 5. State Management
* **Data Fetching:** Prefetched on the server using `queryClient.prefetchQuery` for both `meetings` (limit: 5) and `action_items` (assignedTo: me, limit: 10).
* **Mutations:** Checking off an action item triggers a React Query optimistic update to remove it from the list instantly.
