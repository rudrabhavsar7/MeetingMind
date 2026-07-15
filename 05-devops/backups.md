---
Title: MeetingMind — DevOps: Backups & Disaster Recovery
Version: 2.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-07-11
Dependencies: 04-backend/storage.md, 05-devops/infrastructure.md
---

# MeetingMind DevOps: Backups & Disaster Recovery

## 1. Scope and Ownership

The v1 deployment has a single-host failure domain. Operators must back up PostgreSQL, retained MinIO objects, deployment configuration, and the secret material needed to decrypt/restore them. Redis queues, caches, temporary audio, signed URLs, and derived container state are not authoritative backups.

## 2. Backup Policy

- Run encrypted logical PostgreSQL backups (`pg_dump`) at least daily; retain 35 days by default.
- Where the selected PostgreSQL setup supports WAL archiving, enable point-in-time recovery and test it. Do not claim PITR from logical dumps alone.
- Back up MinIO buckets containing retained/imported media and exports using versioning or an object-aware replication/copy tool.
- Store at least one encrypted backup copy outside the primary host/failure domain in operator-controlled storage.
- Back up deployment configuration and secret references, but store encryption keys separately from backup media.
- Define operator-specific RPO/RTO. The documentation baseline target is RPO 24 hours and RTO 4 hours for a small installation, subject to measured restore results.

Backup jobs must record start/end time, scope, size, checksum/integrity result, destination, and failure without logging meeting content.

## 3. Restore Procedure

1. Provision an isolated host with compatible pinned service versions.
2. Restore configuration and secrets through the operator's secure process.
3. Restore PostgreSQL and run integrity checks before allowing application writes.
4. Restore MinIO objects and verify database object keys resolve; signed URLs are regenerated, never restored.
5. Start Redis empty, then application services and workers.
6. Verify workspace isolation, authentication, transcript/citation integrity, a representative media object, and local AI availability.
7. Change DNS only after acceptance checks; rotate secrets if compromise caused the recovery.

Soft deletion is not a backup. Accidental hard deletion requires a database restore or PITR into an isolated instance followed by controlled recovery. Total-host loss requires the off-host database/object/configuration backups.

## 4. Verification

Run an automated backup-integrity check after every backup and a full isolated restore drill at least quarterly. Record achieved RPO/RTO and remediation. A backup is not considered healthy solely because a file exists.
