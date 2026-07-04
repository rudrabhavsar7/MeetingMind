---
Title: MeetingMind — Backend: Entity-Relationship Diagram
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
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
        string avatar_url
    }

    WORKSPACE_MEMBERSHIP {
        uuid workspace_id PK, FK
        uuid user_id PK, FK
        enum role "admin, member, viewer"
    }

    MEETING {
        uuid id PK
        uuid workspace_id FK
        string title
        timestamp date
        int duration_seconds
        enum status
        string media_url
        text summary
    }

    TRANSCRIPT_SEGMENT {
        uuid id PK
        uuid meeting_id FK
        string speaker_name
        float start_time
        float end_time
        text text
        vector embedding "pgvector(768)"
    }

    ACTION_ITEM {
        uuid id PK
        uuid meeting_id FK
        text description
        string assignee_name
        boolean is_completed
        float citation_timestamp
    }

    DECISION {
        uuid id PK
        uuid meeting_id FK
        string title
        text rationale
    }

    %% Relationships
    WORKSPACE ||--o{ WORKSPACE_MEMBERSHIP : "has members"
    USER ||--o{ WORKSPACE_MEMBERSHIP : "belongs to"
    
    WORKSPACE ||--o{ MEETING : "owns"
    
    MEETING ||--o{ TRANSCRIPT_SEGMENT : "contains speech"
    MEETING ||--o{ ACTION_ITEM : "generates tasks"
    MEETING ||--o{ DECISION : "results in"
```

## 4. Key Relationships Explained

### 4.1 Workspace Core
The `WORKSPACE` is the root of the data graph. Data must not leak between workspaces. The many-to-many relationship between `USER` and `WORKSPACE` is resolved through `WORKSPACE_MEMBERSHIP`, which also carries the RBAC (Role-Based Access Control) payload (`role`).

### 4.2 Meeting Hierarchy
A `MEETING` acts as the aggregate root for all generated AI data.
* If a `MEETING` is deleted, its `TRANSCRIPT_SEGMENT`s, `ACTION_ITEM`s, and `DECISION`s should cascade delete.

### 4.3 The Embedding Vector
The `TRANSCRIPT_SEGMENT` contains the `vector` column. This means RAG queries will return specific segments of a meeting, allowing the UI to link directly to the `start_time` of the relevant audio clip.

## 5. Notes for Implementation
* Ensure `ON DELETE CASCADE` is set on the foreign keys pointing to `MEETING`.
* In SQLAlchemy, configure back-populates to allow eager loading of action items when fetching a meeting.
