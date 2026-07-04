# Workflow: Spec Sync

Use this workflow when documentation conflicts, a decision has been made, or specs need to be aligned.

## Steps

1. Identify the conflicting or stale documents.
2. Determine authority using `AGENTS.md` source authority.
3. Read all affected docs before editing.
4. Patch the fewest documents needed to remove ambiguity.
5. If a product or architecture decision is being finalized, add an entry to `08-resources/decisions-log.md`.
6. Update `PROJECT_MEMORY.md` if the resolved fact is important for future work.

## Known Areas To Watch

- upload size
- embedding dimensions and model choice
- default AI provider policy
- real-time pipeline scope
- pagination strategy
- workspace/multi-tenancy expectations

## Output

Include:

- conflict found
- decision or resolution applied
- docs changed
- remaining unresolved conflicts

