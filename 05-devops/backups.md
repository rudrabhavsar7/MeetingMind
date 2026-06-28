---
Title: MeetingMind — DevOps: Backups & Disaster Recovery
Version: 1.0.0
Status: Approved
Owner: Lead DevOps Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/storage.md
---

# MeetingMind DevOps: Backups & Disaster Recovery

## 1. Overview
Data loss in MeetingMind means losing a company's historical decisions, action items, and intellectual property. A robust Backup and Disaster Recovery (DR) plan is mandatory.

## 2. Relational Database (PostgreSQL)

### 2.1 Automated Backups
* Rely on managed database features (e.g., AWS RDS Automated Backups).
* Retain automated daily snapshots for **35 days**.
* Enable **Point-in-Time Recovery (PITR)**, allowing the database to be restored to any specific second within the last 35 days (useful if a developer accidentally drops a critical table).

### 2.2 Logical Backups (Offsite)
* Perform a nightly logical dump (`pg_dump`) of the database.
* Encrypt the dump file using GPG/KMS.
* Store the encrypted dump in an S3 bucket in a *different geographical region* (e.g., Primary: `us-east-1`, Backup: `us-west-2`).

## 3. Object Storage (S3 / Media)

### 3.1 Versioning
* Enable **S3 Versioning** on the `meetingmind-uploads-prod` bucket. If a file is accidentally overwritten or deleted, the previous version is retained.

### 3.2 Cross-Region Replication (CRR)
* For extreme DR compliance (Enterprise tier), enable CRR to replicate all raw meeting media to a backup region.
* Note: This doubles storage costs. For standard tiers, rely on the fact that S3 inherently provides 99.999999999% (11 9's) of durability within a single region.

## 4. Disaster Recovery (DR) Scenarios

### Scenario A: Accidental Data Deletion (User Error)
* **Situation:** A user deletes a critical workspace.
* **Response:** Because we use "Soft Deletes" (`is_deleted=True`), the admin can simply run a SQL update to restore the workspace instantly.

### Scenario B: Accidental Data Deletion (Admin Error)
* **Situation:** An admin runs a hard `DELETE` query dropping records.
* **Response:** Use RDS Point-in-Time Recovery to spin up a clone of the database to exactly 1 minute before the deletion occurred. Extract the missing records and re-insert them into production.

### Scenario C: Complete Region Failure (e.g., AWS `us-east-1` goes offline)
* **Situation:** MeetingMind is entirely inaccessible.
* **Response (RTO: 4 hours, RPO: 24 hours):**
  1. Update DNS (Route53) to point to the backup region.
  2. Restore the database from the nightly encrypted cross-region S3 backup.
  3. Spin up ECS/Fargate containers in the backup region using the Terraform/CloudFormation IaC templates.
  4. Note: Any meetings uploaded between the last backup and the outage will be temporarily unavailable until the primary region recovers.

## 5. Testing the Backups
Backups are useless if they cannot be restored.
* **Quarterly DR Drill:** A DevOps engineer must manually restore the production database into a staging environment from the backup files to verify integrity and measure Time-to-Recovery.
