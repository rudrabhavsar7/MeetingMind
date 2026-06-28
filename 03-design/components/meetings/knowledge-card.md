---
Title: MeetingMind — Component: Knowledge Card
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/components/data-display/card.md
---

# MeetingMind Component: Knowledge Card

## 1. Overview
A persistent visual record of a key entity (person, project, client, term) mentioned across multiple meetings, serving as a mini-wiki entry built by the AI.

## 2. Design Philosophy
Information shouldn't be locked inside individual transcripts. Knowledge Cards extract semantic entities and build a graph of understanding.

## 3. Problem Statement
A user searches for "Project Phoenix" and just gets a list of 15 meetings where it was mentioned. They have to read all 15 to understand what the project actually is.

## 4. UX Goals
* Synthesize cross-meeting context into one digestible card.
* Provide quick definitions for company-specific jargon.

## 5. Usage Guidelines
* Used in the "Knowledge Base" section of the app.
* Can appear in a HoverCard when a user hovers over a capitalized entity name in a transcript.

## 6. When to Use
* Displaying definitions, project summaries, or client briefs.

## 7. When NOT to Use
* For a single, isolated mention of a word.

## 8. Component Anatomy
* Container (Card).
* Header: Entity Name + Entity Type Badge (e.g., "Person", "Project").
* Body: Auto-generated summary of the entity.
* Footer: "Mentioned in X meetings" link.

## 9. Variants
* **Inline Popup:** Rendered inside a HoverCard or Popover for quick definition.
* **Full View:** Rendered on a dedicated page with a timeline of when the entity was discussed.

## 10. Sizes
* `max-w-md` for Popups.

## 11. States
* Static.

## 12. Layout Rules
* Standard Card layout.

## 13. Content Guidelines
* The summary must be purely factual based on transcript data (e.g., "Project Phoenix is the Q4 marketing initiative led by Maya...").

## 14. Icon Rules
* Use an icon matching the entity type (e.g., `User` for Person, `Briefcase` for Client, `Folder` for Project).

## 15. Color System
* Use standard colors.

## 16. Typography
* Title: `text-lg font-semibold`.

## 17. Spacing
* Padding `p-4`.

## 18. Motion
* None.

## 19. Accessibility
* Standard card ARIA.

## 20. Keyboard Interaction
* N/A.

## 21. Responsive Behavior
* Fluid width.

## 22. Dark Mode
* Inherited.

## 23. Design Tokens
* `--card`.

## 24. API Specification
```tsx
<Card className="w-full max-w-sm">
  <CardHeader className="pb-2">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <Folder className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Project Phoenix</CardTitle>
      </div>
      <Badge variant="outline">Project</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      The internal codename for the Next.js 15 migration. Primarily discussed by the Frontend Guild. Target completion date is Q4 2026.
    </p>
  </CardContent>
  <CardFooter>
    <Link href="/search?q=Project+Phoenix" className="text-xs text-primary hover:underline">
      View 14 related meetings &rarr;
    </Link>
  </CardFooter>
</Card>
```

## 25. Props Reference
* Extends Card.

## 26. Events
* N/A.

## 27. Composition
* Combines Card, Badge.

## 28. AI Usage Guidelines
* Requires a sophisticated background pipeline to perform Entity Extraction (NER) on transcripts and cluster mentions into these persistent "Knowledge" objects.

## 29. Error Handling
* N/A.

## 30. Edge Cases
* Merging entities: AI might create "Project Phoenix" and "Phoenix Project". Needs a UI mechanism for the user to merge them.

## 31. Performance
* Fast on frontend. Expensive on backend.

## 32. Security Considerations
* Ensure knowledge cards respect tenant boundaries. One company's Project Phoenix should never leak to another workspace.

## 33. Analytics Events
* N/A.

## 34. Storybook Stories
* Hover Popup, Full Card.

## 35. Figma Mapping
* `Knowledge/Card`

## 36. shadcn/ui Mapping
* N/A.

## 37. Tailwind Mapping
* Standard layout classes.

## 38. Implementation Notes
* N/A.

## 39. QA Checklist
* N/A.

## 40. Acceptance Criteria
* Distinctive, informative entity summary.

## 41. Future Enhancements
* Let users manually edit the AI-generated definition.

## 42. CTO Notes
* This is a v2 feature. The backend entity extraction and graph building is complex. Build the UI component first, but power it with mock data until the backend pipeline is ready.
