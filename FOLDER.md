# 📁 MeetingMind Documentation Structure

```
MeetingMind/
│
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
│
├── 00-project/
│   ├── vision.md
│   ├── product-overview.md
│   ├── glossary.md
│   ├── roadmap.md
│   ├── success-metrics.md
│   └── architecture-overview.md
│
├── 01-product/
│   ├── prd.md
│   ├── trd.md
│   ├── user-personas.md
│   ├── user-journeys.md
│   ├── information-architecture.md
│   ├── feature-matrix.md
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   ├── api-requirements.md
│   ├── security-requirements.md
│   └── acceptance-criteria.md
│
├── 02-engineering/
│   ├── coding-standards.md
│   ├── folder-structure.md
│   ├── naming-conventions.md
│   ├── branching-strategy.md
│   ├── commit-guidelines.md
│   ├── api-design.md
│   ├── state-management.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── error-handling.md
│   ├── logging.md
│   ├── monitoring.md
│   ├── testing-strategy.md
│   ├── deployment.md
│   ├── performance.md
│   ├── jira-tickets.md
│   └── jira-task-breakdown.md
│
├── 03-design/
│   │
│   ├── design-system.md
│   ├── design-tokens.md
│   ├── experience-tokens.md
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   ├── motion.md
│   ├── icons.md
│   ├── accessibility.md
│   ├── layouts.md
│   ├── navigation.md
│   │
│   ├── pages/
│   │   ├── dashboard.md
│   │   ├── meetings.md
│   │   ├── meeting-details.md
│   │   ├── ai-search.md
│   │   ├── upload.md                  # Recording import fallback
│   │   ├── extension-capture.md       # Chrome extension capture UX
│   │   ├── settings.md
│   │   ├── authentication.md
│   │   ├── profile.md
│   │   ├── notifications.md
│   │   ├── onboarding.md
│   │   ├── pricing.md
│   │   ├── landing-page.md
│   │   ├── 404.md
│   │   └── error-pages.md
│   │
│   └── components/
│       │
│       ├── index.md
│       │
│       ├── foundation/
│       │   ├── button.md
│       │   ├── button-group.md
│       │   ├── icon-button.md
│       │   ├── badge.md
│       │   ├── chip.md
│       │   ├── avatar.md
│       │   ├── divider.md
│       │   ├── skeleton.md
│       │   ├── spinner.md
│       │   └── progress.md
│       │
│       ├── forms/
│       │   ├── input.md
│       │   ├── textarea.md
│       │   ├── select.md
│       │   ├── combobox.md
│       │   ├── checkbox.md
│       │   ├── radio-group.md
│       │   ├── switch.md
│       │   ├── slider.md
│       │   ├── date-picker.md
│       │   └── calendar.md
│       │
│       ├── navigation/
│       │   ├── sidebar.md
│       │   ├── breadcrumb.md
│       │   ├── navigation-menu.md
│       │   ├── tabs.md
│       │   ├── pagination.md
│       │   └── command-palette.md
│       │
│       ├── overlays/
│       │   ├── dialog.md
│       │   ├── drawer.md
│       │   ├── sheet.md
│       │   ├── popover.md
│       │   ├── tooltip.md
│       │   ├── dropdown.md
│       │   ├── context-menu.md
│       │   └── hover-card.md
│       │
│       ├── feedback/
│       │   ├── alert.md
│       │   ├── toast.md
│       │   ├── empty-state.md
│       │   ├── loading-state.md
│       │   ├── error-state.md
│       │   └── confirmation-dialog.md
│       │
│       ├── data-display/
│       │   ├── card.md
│       │   ├── table.md
│       │   ├── accordion.md
│       │   ├── timeline.md
│       │   ├── list.md
│       │   ├── stats.md
│       │   └── charts.md
│       │
│       ├── ai/
│       │   ├── ai-search.md
│       │   ├── ai-summary.md
│       │   ├── ai-processing.md
│       │   ├── ai-citation.md
│       │   ├── ai-confidence.md
│       │   ├── ai-chat-message.md
│       │   ├── ai-suggestion.md
│       │   └── ai-insight-card.md
│       │
│       └── meetings/
│           ├── meeting-card.md
│           ├── transcript-viewer.md
│           ├── speaker-chip.md
│           ├── action-item.md
│           ├── decision-card.md
│           ├── topic-card.md
│           ├── meeting-timeline.md
│           ├── upload-zone.md
│           ├── recording-status.md
│           └── knowledge-card.md
│
├── 04-backend/
│   ├── database-schema.md
│   ├── er-diagram.md
│   ├── api-specification.md
│   ├── ai-pipeline.md
│   ├── transcription.md
│   ├── rag-architecture.md
│   ├── vector-database.md
│   ├── authentication-flow.md
│   ├── storage.md
│   └── background-jobs.md
│
├── 05-devops/
│   ├── infrastructure.md
│   ├── docker.md
│   ├── ci-cd.md
│   ├── monitoring.md
│   ├── backups.md
│   ├── secrets-management.md
│   └── environments.md
│
├── 06-testing/
│   ├── testing-strategy.md
│   ├── unit-testing.md
│   ├── integration-testing.md
│   ├── e2e-testing.md
│   ├── accessibility-testing.md
│   ├── performance-testing.md
│   ├── security-testing.md
│   └── qa-checklists.md
│
├── 07-prompts/
│   ├── cursor-rules.md
│   ├── copilot-rules.md
│   ├── ai-agent-rules.md
│   ├── codex-rules.md
│   ├── ui-prompts.md
│   ├── backend-prompts.md
│   ├── testing-prompts.md
│   └── documentation-prompts.md
│
└── 08-resources/
    ├── references.md
    ├── decisions-log.md
    ├── release-notes.md
    ├── changelog-template.md
    └── templates/
        ├── component-template.md
        ├── page-template.md
        ├── api-template.md
        ├── architecture-template.md
        └── meeting-template.md
```
