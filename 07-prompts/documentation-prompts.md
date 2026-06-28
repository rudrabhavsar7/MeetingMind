---
Title: MeetingMind — Prompts: Documentation Generation
Version: 1.0.0
Status: Approved
Owner: Technical Writer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind: Documentation Generation Prompts

## 1. Overview
MeetingMind requires extensive internal documentation (as you are reading right now). When creating new documentation files, use these prompts to ensure the AI generates structural, comprehensive, and perfectly formatted Markdown documents.

## 2. The Universal Documentation Constraint
Append this to all documentation generation requests:

> **Documentation Constraints:**
> 1. Use standard Markdown format.
> 2. Include a YAML frontmatter block at the top with `Title`, `Version`, `Status`, `Owner`, `Last Updated`, and `Dependencies`.
> 3. Use a clear, hierarchical header structure (e.g., `# 1. Overview`, `## 2. Details`, `### 2.1 Sub-details`).
> 4. Ensure all code blocks have the appropriate language tag (e.g., `tsx`, `python`, `bash`, `json`).
> 5. Tone should be professional, authoritative, and concise. Explain *why* a decision was made, not just *what* it is.

## 3. Generating a System Architecture Doc
> "Generate a System Architecture Markdown document for a new microservice named `[ServiceName]`. 
> Use the Documentation Constraints. 
> Ensure the document includes:
> - A high-level overview.
> - A list of core dependencies.
> - An explanation of its data flow (preferably including a Mermaid.js sequence diagram).
> - Security considerations.
> - Error handling strategies."

## 4. Generating API Documentation
> "Generate internal API documentation for the `[EndpointPath]` endpoint.
> Use the Documentation Constraints.
> Ensure the document includes:
> - HTTP Method and Path.
> - Authentication requirements.
> - Request body schema (as a JSON example).
> - Successful response schema (200 OK).
> - Possible error responses (400, 401, 403, 404, 500) and what triggers them.
> - A `curl` example."

## 5. Generating Component Documentation
> "Generate documentation for the React component `[ComponentName]`.
> Use the Documentation Constraints.
> Ensure the document includes:
> - A description of what the component does and when to use it.
> - When NOT to use it.
> - A Props API table.
> - A basic usage example in TSX.
> - Accessibility (a11y) considerations for this specific component."

## 6. Updating the Decision Log
> "We just made the architectural decision to switch from RabbitMQ to Redis for our Celery broker because RabbitMQ was over-engineered for our needs and we already use Redis for caching. 
> Draft an entry for the `decisions-log.md` file using the standard ADR (Architecture Decision Record) format: Context, Decision, Consequences."
