---
Title: MeetingMind — Resources: Changelog Template
Version: 1.0.0
Status: Approved
Owner: Product Manager
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind Resources: Changelog Template

## 1. Overview
This template should be used when creating user-facing release notes or updating the internal `release-notes.md` file. It follows the principles of [Keep a Changelog](https://keepachangelog.com/).

## 2. Formatting Rules
* Dates must follow the `YYYY-MM-DD` format.
* Group changes into: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
* Explain *why* a change is important to the user, not just the technical implementation.

---

## 3. Template

```markdown
## [Version Number] - YYYY-MM-DD
**"Optional Thematic Title"**

Brief introductory paragraph explaining the overarching goal or theme of this release.

### Added
* [Feature Area] Description of the new feature.
* [Feature Area] Description of another new feature.

### Changed
* [Feature Area] Description of a change to existing functionality. Mention if it breaks backward compatibility.

### Deprecated
* [Feature Area] Description of a feature that will be removed in a future release. Provide the recommended alternative.

### Removed
* [Feature Area] Description of a feature that has been permanently removed.

### Fixed
* [Bug Fix] Description of the bug and how it was resolved.
* [Bug Fix] Description of another bug fix.

### Security
* [Security] Description of a security enhancement or patched vulnerability (keep vague if necessary to protect unpatched systems).
```

## 4. Example Usage

```markdown
## [v1.1.2] - 2026-08-14

### Added
* [Meetings] Added the ability to manually merge two speakers in the Transcript Viewer if the AI incorrectly split them.
* [Integrations] Added Google Calendar sync to automatically pull upcoming meeting titles.

### Changed
* [Uploads] The maximum file upload size has been increased from 2GB to 4GB.

### Fixed
* [Authentication] Resolved an issue where expired refresh tokens caused a blank white screen instead of redirecting to the login page.
* [UI] Fixed a bug where the `KnowledgeCard` popup would render off-screen on mobile devices.
```
