---
Title: MeetingMind — Commit Guidelines
Version: 1.0.0
Status: Approved
Owner: Lead DevOps
Last Updated: 2026-06-28
Dependencies: 02-engineering/branching-strategy.md
---

# MeetingMind — Commit Guidelines

MeetingMind strictly enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification. This ensures a readable project history and enables automated semantic versioning and changelog generation.

## 1. Commit Message Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Example
```text
feat(auth): add JWT refresh token rotation

Implemented rotating refresh tokens in the auth middleware to prevent 
replay attacks. A new cookie is issued on every refresh request.

BREAKING CHANGE: The `refresh_token` endpoint now invalidates the old token immediately.
Closes MM-142
```

## 2. Allowed Types

* `feat`: A new feature (correlates with MINOR in Semantic Versioning).
* `fix`: A bug fix (correlates with PATCH in Semantic Versioning).
* `docs`: Documentation only changes.
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
* `refactor`: A code change that neither fixes a bug nor adds a feature.
* `perf`: A code change that improves performance.
* `test`: Adding missing tests or correcting existing tests.
* `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation.
* `ci`: Changes to CI configuration files and scripts (e.g., GitHub Actions).

## 3. Allowed Scopes

Scopes help contextualize the commit. Allowed scopes in MeetingMind:
* `frontend`
* `backend`
* `ai` (Whisper, LLM, Prompts)
* `db` (Migrations, Models)
* `auth`
* `meetings` (Upload, View)
* `search` (RAG)
* `workspace`
* `export`
* `devops` (Docker, Traefik)
* `deps` (Dependency updates)

## 4. Best Practices

* **Subject Line:** Imperative mood, lowercase, max 72 characters, no period at the end. (e.g., `fix(ui): resolve button overflow` NOT `Fixed button overflow.`).
* **Body:** Explain *why* the change was made, not *how*. The code explains how. Wrap the body at 72 characters.
* **Footer:** Use for referencing issue tracker IDs (`Closes MM-123`) or declaring breaking changes (`BREAKING CHANGE: ...`).

## 5. Automated Enforcement (Commitlint)

We use `commitlint` and `husky` to enforce these rules locally before a commit is created.

**`commitlint.config.js`:**
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'frontend', 'backend', 'ai', 'db', 'auth', 
        'meetings', 'search', 'workspace', 'export', 
        'devops', 'deps'
      ]
    ],
  }
};
```
If a commit fails linting, the Git hook will abort the commit.
