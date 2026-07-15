---
Title: MeetingMind — Backend: Entity-Relationship Diagram
Version: 1.2.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-10
Dependencies: 04-backend/database-schema.md
---

# MeetingMind Backend: ER Diagram

## 1. Overview
This document provides a visual representation of the MeetingMind PostgreSQL database schema using Mermaid.js.

## 2. Diagram Philosophy
The ER diagram focuses on logical relationships. It abstracts away audit fields (like `created_at`, `updated_at`) unless they are critical for business logic, prioritizing foreign key relationships and multiplicity.

## 3. Mermaid ER Diagram

```mermaid
erDiagram
    WORKSPACE {
        uuid id PK
        string name
        jsonb settings
        timestamp created_at
    }

    USER {
        uuid id PK
        string email UK
        string name
        string avatar_object_key
    }

    WORKSPACE_MEMBERSHIP {
        uuid workspace_id PK, FK
        uuid user_id PK, FK
        enum role "owner, admin, member, viewer"
    }

    WORKSPACE_INVITATION {
        uuid id PK
        uuid workspace_id FK
        uuid invited_by_user_id FK
        string email
        enum role "admin, member, viewer"
        string token_hash UK
        timestamp expires_at
        timestamp accepted_at
        timestamp revoked_at
    }

    PASSWORD_RESET_TOKEN {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamp expires_at
        timestamp used_at
        timestamp revoked_at
    }

    REFRESH_TOKEN {
        uuid id PK
        uuid user_id FK
        uuid replaced_by_token_id FK
        string token_hash UK
        timestamp expires_at
        timestamp revoked_at
    }

    EXTENSION_SESSION {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        string device_id
        string token_hash UK
        timestamp expires_at
        timestamp revoked_at
    }

    MEETING {
        uuid id PK
        uuid workspace_id FK
        uuid created_by_user_id FK
        uuid current_summary_version_id FK
        string title
        enum source_type
        enum source_app
        timestamp started_at
        timestamp ended_at
        int duration_seconds
        enum status
    }

    MEETING_PARTICIPANT {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid user_id FK
        string display_name
    }

    MEDIA_OBJECT {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        enum kind
        string object_key
        timestamp retention_until
    }

    TRANSCRIPT_SEGMENT {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid client_instance_id
        int sequence_number
        string speaker_label
        string speaker_name
        float start_time
        float end_time
        text text
    }

    TRANSCRIPT_CHUNK {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid first_segment_id FK
        uuid last_segment_id FK
        string content_hash
        string embedding_model
        vector embedding "pgvector(768)"
    }

    AI_PROCESSING_RUN {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        enum stage
        string model
        string prompt_version
        string input_hash
        enum status
    }

    SUMMARY_VERSION {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid ai_processing_run_id FK
        int version
        text executive_summary
        enum status
    }

    ACTION_ITEM {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid ai_processing_run_id FK
        text text
        uuid assignee_user_id FK
        string assignee_name
        timestamp due_date
        enum status
    }

    DECISION {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid ai_processing_run_id FK
        string title
        text text
        text rationale
    }

    AI_OUTPUT_CITATION {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid transcript_segment_id FK
        uuid summary_version_id FK
        uuid action_item_id FK
        uuid decision_id FK
        float start_time
        float end_time
    }

    AI_OUTPUT_FEEDBACK {
        uuid id PK
        uuid workspace_id FK
        uuid meeting_id FK
        uuid user_id FK
        uuid summary_version_id FK
        uuid action_item_id FK
        uuid decision_id FK
        enum rating "up, down"
    }

    %% Relationships
    WORKSPACE ||--o{ WORKSPACE_MEMBERSHIP : "has members"
    USER ||--o{ WORKSPACE_MEMBERSHIP : "belongs to"
    WORKSPACE ||--o{ WORKSPACE_INVITATION : "has pending invitations"
    USER ||--o{ WORKSPACE_INVITATION : "issues"
    USER ||--o{ PASSWORD_RESET_TOKEN : "resets password with"
    USER ||--o{ REFRESH_TOKEN : "has sessions"
    USER ||--o{ EXTENSION_SESSION : "connects devices"
    
    WORKSPACE ||--o{ MEETING : "owns"
    MEETING ||--o{ MEETING_PARTICIPANT : "observes participants"
    MEETING ||--o{ MEDIA_OBJECT : "stores private media"
    MEETING ||--o{ TRANSCRIPT_SEGMENT : "contains speech"
    MEETING ||--o{ TRANSCRIPT_CHUNK : "indexes retrieval chunks"
    TRANSCRIPT_SEGMENT ||--o{ TRANSCRIPT_CHUNK : "bounds chunks"
    MEETING ||--o{ AI_PROCESSING_RUN : "runs AI stages"
    AI_PROCESSING_RUN ||--o{ SUMMARY_VERSION : "generates"
    AI_PROCESSING_RUN ||--o{ ACTION_ITEM : "extracts"
    AI_PROCESSING_RUN ||--o{ DECISION : "extracts"
    MEETING ||--o{ SUMMARY_VERSION : "has versions"
    MEETING ||--o{ ACTION_ITEM : "generates tasks"
    MEETING ||--o{ DECISION : "results in"
    TRANSCRIPT_SEGMENT ||--o{ AI_OUTPUT_CITATION : "supports claims"
    SUMMARY_VERSION ||--o{ AI_OUTPUT_CITATION : "is cited by"
    ACTION_ITEM ||--o{ AI_OUTPUT_CITATION : "is cited by"
    DECISION ||--o{ AI_OUTPUT_CITATION : "is cited by"
    USER ||--o{ AI_OUTPUT_FEEDBACK : "rates"
    SUMMARY_VERSION ||--o{ AI_OUTPUT_FEEDBACK : "receives"
    ACTION_ITEM ||--o{ AI_OUTPUT_FEEDBACK : "receives"
    DECISION ||--o{ AI_OUTPUT_FEEDBACK : "receives"
```

## 4. Key Relationships Explained

### 4.1 Workspace Core
The `WORKSPACE` is the root of the data graph. Data must not leak between workspaces. The many-to-many relationship between `USER` and `WORKSPACE` is resolved through `WORKSPACE_MEMBERSHIP`, which also carries the RBAC (Role-Based Access Control) payload (`role`).

In v1, the deployment exposes one active default workspace per ADR 010. Pending invitations do not grant access; a membership is created only when invitation registration succeeds. Invitation and password-reset tokens are stored only as hashes.

### 4.2 Meeting Hierarchy
A `MEETING` acts as the aggregate root for all generated AI data.
* It owns participants, private media-object keys, immutable transcript source segments, retrieval chunks, processing runs, versioned summaries, action items, decisions, and their citations.
* Normal reads exclude a soft-deleted Meeting. Hard deletion cascades meeting-owned records only after the retention window.

### 4.3 The Embedding Vector
`TRANSCRIPT_CHUNK` contains the `vector(768)` column and references its first/last source segments. Retrieval returns chunks, while citations resolve back to exact immutable `TRANSCRIPT_SEGMENT` rows and timestamps.

## 5. Notes for Implementation
* Follow `04-backend/data-dictionary.md` for fields, check constraints, direct workspace IDs, delete behavior, and required indexes.
* `AI_OUTPUT_CITATION` must reference exactly one output type and all related rows must share workspace and meeting.
