---
Title: MeetingMind — Component: AI Insight Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/card.md
---

# MeetingMind Component: AI Insight Card

## 1. Overview
A specialized card highlighting a critical cross-meeting observation or anomaly discovered proactively by the AI.

## 2. Design Philosophy
Most AI interaction is reactive (user asks, AI answers). The Insight Card is proactive (AI notifies user of a trend). It must look distinct from standard data cards to indicate its origin.

## 3. Problem Statement
Users don't know what they don't know. They might not realize that "Project Phoenix" has been delayed in three separate meetings this month.

## 4. UX Goals
* Catch attention without being alarming.
* Provide deep links to the source meetings.

## 5. Usage Guidelines
* Displayed on the main Dashboard.

## 6. When to Use
* Surfacing trends, sentiment analysis anomalies, or recurring blockers.

## 7. When NOT to Use
* For basic metrics (Use `StatCard`).
* For single-meeting summaries (Use `AISummaryBlock`).

## 8. Component Anatomy
* Container (Card with primary-colored gradient border or subtle background).
* Icon (`Sparkles` or `Lightbulb`).
* Headline ("Project Phoenix is consistently blocked").
* Description text.
* Source Links ("Mentioned in 3 meetings").

## 9. Variants
* **Trend:** Highlights a pattern.
* **Sentiment:** Highlights a change in tone (e.g., "Client X seemed frustrated").

## 10. Sizes
* Usually spans 2 columns in a dashboard grid.

## 11. States
* Hover (Interactive links to meetings).

## 12. Layout Rules
* Standard Card layout.

## 13. Content Guidelines
* Keep insights actionable. "You've had 5 meetings this week" is a statistic, not an insight. "You spend 40% of your time discussing Jira tickets" is an insight.

## 14. Icon Rules
* `Lightbulb` (yellow/primary) is standard for insights.

## 15. Color System
* Background: `bg-primary/5` (very faint tint).
* Border: `border-primary/20`.

## 16. Typography
* Headline: `text-base font-semibold`.

## 17. Spacing
* `p-6`.

## 18. Motion
* None required.

## 19. Accessibility
* Standard card ARIA.

## 20. Keyboard Interaction
* Links must be focusable.

## 21. Responsive Behavior
* Stacks on mobile.

## 22. Dark Mode
* The faint background tint must be checked for contrast in dark mode to avoid looking murky.

## 23. Design Tokens
* `--primary`.

## 24. API Specification
```tsx
<Card className="border-primary/20 bg-primary/5">
  <CardHeader className="flex flex-row items-center gap-2">
    <Lightbulb className="h-5 w-5 text-primary" />
    <CardTitle className="text-base">Recurring Blocker</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm">
      "Database Migration" has been cited as a blocker in 4 different meetings this week across 2 teams.
    </p>
    <div className="mt-4 flex gap-2">
      <Badge variant="outline">Backend Sync</Badge>
      <Badge variant="outline">Product Weekly</Badge>
    </div>
  </CardContent>
</Card>
```

## 25. Props Reference
* Extends Card.

## 26. Events
* N/A.

## 27. Composition
* Uses Card, Badge, Icons.

## 28. AI Usage Guidelines
* Generated via a weekly cron job that runs a MapReduce prompt over all transcript summaries for a user's workspace.

## 29. Error Handling
* If no insights are found, simply do not render this component on the dashboard.

## 30. Edge Cases
* Insights that are obvious or unhelpful. Provide a "Dismiss / Not Helpful" X button to train the system.

## 31. Performance
* Backend generation is slow, so these must be pre-calculated and cached in the database, not generated on page load.

## 32. Security Considerations
* Ensure the cross-meeting query respects RBAC (don't generate insights based on private meetings the viewing user shouldn't see).

## 33. Analytics Events
* Track "Dismiss" vs "Click-through" rates to measure the quality of the AI's proactive insights.

## 34. Storybook Stories
* Default Insight.

## 35. Figma Mapping
* `AI/InsightCard`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* `bg-primary/5 border-primary/20`

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Distinctive card style, actionable content.

## 41. Future Enhancements
* Feedback mechanism (Thumbs up/down) directly on the card.

## 42. CTO Notes
* This requires a secondary Celery pipeline that runs asynchronously on a schedule (e.g., Sunday night) to process the week's embeddings.
