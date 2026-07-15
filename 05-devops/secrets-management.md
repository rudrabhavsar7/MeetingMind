---
Title: MeetingMind — DevOps: Secrets Management
Version: 2.1.0
Status: Approved
Owner: Lead Security Engineer
Last Updated: 2026-07-11
Dependencies: 05-devops/environments.md
---

# MeetingMind DevOps: Secrets Management

## 1. Core Rules

- Never commit populated `.env` files, credentials, private keys, tokens, database dumps, or model-provider keys.
- Never bake secrets into images, frontend bundles, logs, traces, screenshots, or support exports.
- Commit only a `.env.example` containing variable names and safe placeholders.
- The default self-hosted deployment requires no external-provider secrets.

## 2. v1 Secret Storage

For the single-host Compose deployment, prefer Docker secrets or root-owned files readable only by the service that needs them. A restricted deployment `.env` file is acceptable where Compose support requires it, provided it is stored outside source control, has restrictive filesystem permissions, and is included in the operator's secret backup/rotation process.

Required secret classes include database credentials, MinIO credentials, JWT/access-token signing material, refresh/invitation/reset-token hashing material, and any backup-encryption keys. Generate unique high-entropy values per environment; production startup must reject documented placeholders.

Example variable names only:

```dotenv
DATABASE_URL=postgresql+asyncpg://meetingmind:<generated>@postgres:5432/meetingmind
JWT_SECRET_KEY=<generated-high-entropy-value>
MINIO_ROOT_USER=<generated>
MINIO_ROOT_PASSWORD=<generated-high-entropy-value>
EXTERNAL_AI_ENABLED=false
TELEMETRY_ENABLED=false
```

## 3. Optional Integrations

Cloud secret managers or HashiCorp Vault may be used in optional deployment profiles. External AI, SMTP, webhook, cloud-storage, and hosted-observability credentials are provisioned only when their adapters are explicitly enabled. Configuration validation must fail closed: a stray API key must not enable egress, and an enabled adapter without its required secret must not silently fall back.

Variables prefixed `NEXT_PUBLIC_` are embedded in browser JavaScript and may contain public origins or feature flags only—never secrets.

## 4. Supabase PostgreSQL for Development and Staging

- Store development and staging PostgreSQL URLs in the team's approved secret manager; never in Git, frontend environment variables, screenshots, or chat.
- Use different least-privilege database roles for `meetingmind_dev` and `meetingmind_staging`; each role can use only its schema plus the shared `extensions` schema required by pgvector.
- Supabase personal access tokens and MCP OAuth credentials are administrator/developer tooling credentials, not application runtime credentials.
- Do not expose the database URL, project password, service-role key, anon key, or MCP credential through `NEXT_PUBLIC_*`.
- Rotate a credential when a team member leaves or a development machine is compromised.

## 5. Rotation and Incident Response

- Rotate a compromised secret immediately and audit access; routine rotation intervals are operator policy.
- Database/MinIO rotation should support an overlap or controlled maintenance window.
- Rotating JWT signing material invalidates active tokens unless a versioned keyring is implemented.
- Invitation, password-reset, refresh, and extension-session tokens are stored hashed; revoke active records after related secret compromise.
- Backup-encryption keys must be stored separately from backup media. Loss of the key is data loss; compromise requires re-encryption and access review.
