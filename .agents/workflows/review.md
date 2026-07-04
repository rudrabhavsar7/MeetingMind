# Workflow: Review

Use this workflow for code review, documentation review, architecture review, or pre-merge checks.

## Steps

1. Identify the review target: diff, files, ticket, or docs.
2. Read the relevant source documents from `.agents/context-map.md`.
3. Inspect the actual files or diff.
4. Look for:
   - behavior bugs
   - security or data isolation issues
   - privacy-first violations
   - API contract mismatches
   - database migration risks
   - accessibility gaps
   - missing tests
   - documentation drift
5. Report findings first, ordered by severity.

## Output

Use this order:

1. Findings
2. Open questions or assumptions
3. Brief summary
4. Testing gaps

If there are no findings, say that clearly and mention remaining risk.

