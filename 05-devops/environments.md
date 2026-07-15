---
Title: MeetingMind — DevOps: Environments
Version: 2.1.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-07-11
Dependencies: 05-devops/infrastructure.md, 08-resources/decisions-log.md#adr-014-supabase-postgresql-for-shared-development-and-staging
---

# MeetingMind DevOps: Environments Strategy

## 1. Environment Classes

### Development

Runs local application processes while using the shared Supabase PostgreSQL project's `meetingmind_dev` schema. Redis, MinIO, Ollama, STT, and other application services remain local; no Supabase service other than PostgreSQL/pgvector is used. Developers use individual/rotatable least-privilege credentials and synthetic or explicitly licensed sample media. Debug logging must still avoid transcript/audio content and secrets.

### CI

Uses isolated service containers, deterministic fixtures, and mocked AI/provider adapters. CI must not call external AI, telemetry, email, or cloud-storage services and must not use production data or credentials.

### Staging

Runs an isolated application deployment with the same local/self-hosted non-database services as v1, but connects to the Supabase PostgreSQL project's separate `meetingmind_staging` schema using staging-only credentials. It uses synthetic or purpose-created QA meeting data, local models or deterministic provider fakes, separate Redis/MinIO/secrets, and a separate hostname. Production backups must not be restored into staging.

### Production

Runs the operator-controlled v1 topology described in `05-devops/infrastructure.md`. The operator owns its hostname, TLS, secrets, models, retention, backups, and outbound-network policy.

## 2. Isolation Rules

- Development and staging may share the managed Supabase PostgreSQL project, but never a schema, database role, Alembic version table, or application credential. Their required search paths are `meetingmind_dev,extensions,public` and `meetingmind_staging,extensions,public` respectively.
- No environment may share Redis instances, MinIO buckets, JWT keys, invitation/reset token secrets, or encryption keys with another environment.
- Staging and preview builds must never connect to production services.
- Real production meeting content must not be copied into development, CI, demos, or routine QA.
- External-provider evaluation is a separate explicit activity using synthetic/redacted inputs. It is not the standard staging configuration.
- Email, webhooks, and notifications use local sinks/fakes unless the environment owner explicitly enables and scopes a provider.
- Supabase Auth, Storage, Realtime, Edge Functions, and client SDKs are prohibited for the current development/staging architecture.
- Database DDL is applied only through reviewed Alembic migrations. Dashboard/MCP experiments must be captured in a migration before teammates or staging depend on them.

## 3. Configuration

Use `ENVIRONMENT=development|ci|staging|production` for operational behavior, never for bypassing authorization or workspace isolation. Public origins, storage endpoints, model identifiers, retention, and integration enablement must be explicit. Production must reject placeholder secrets and unsafe wildcard origins at startup.

Development and staging set `MEETINGMIND_DATABASE_URL` from a secret store. Each database role has its fixed environment search path configured server-side, so application code cannot select the other environment schema. Connection strings must require TLS and use a Supabase connection mode compatible with async SQLAlchemy/Alembic. Never commit the project password, pooler URL, access token, or MCP OAuth material.

Ephemeral frontend previews may be built by any CI platform, but they must use mocked APIs or an isolated preview backend; they must not point at staging or production by default.
