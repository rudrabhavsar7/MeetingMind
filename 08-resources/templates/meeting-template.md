---
Title: MeetingMind — Template: Standard Meeting Output
Version: 1.0.0
Status: Approved
Owner: Template Maintainer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Template: Standard Meeting Output

## 1. Overview
This is not a documentation template, but rather the standardized JSON/Markdown format that the LLM is instructed to generate when summarizing a meeting.

## 2. System Prompt Instructions
The AI pipeline is instructed to output the following JSON schema:

```json
{
  "title": "Generated distinct title based on content",
  "executive_summary": "A 3-5 sentence paragraph summarizing the core purpose and outcome of the meeting.",
  "action_items": [
    {
      "task": "What needs to be done",
      "assignee": "Name of person (if mentioned)",
      "due_date": "Date (if mentioned)"
    }
  ],
  "decisions_made": [
    {
      "decision": "What was agreed upon",
      "rationale": "Why it was agreed upon"
    }
  ],
  "key_topics": [
    "Topic 1",
    "Topic 2"
  ]
}
```

## 3. UI Rendering
The frontend consumes this JSON and renders it into the `AISummaryBlock`, `ActionItem` list, and `DecisionCard` components.
