---
Title: MeetingMind — Backend: Vector Database
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/database-schema.md
---

# MeetingMind Backend: Vector Database

## 1. Overview
MeetingMind uses `pgvector` as its vector database, running directly inside the primary PostgreSQL instance. This simplifies infrastructure, eliminates data synchronization issues between a relational DB and a standalone Vector DB, and allows combining semantic search with standard relational filtering (e.g., RBAC).

## 2. pgvector Setup

### Installation
Ensure the PostgreSQL instance has the `vector` extension installed. (Available on AWS RDS, Supabase, Neon, etc.)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Table Definition (SQLAlchemy Example)
```python
from sqlmodel import Field, SQLModel
from pgvector.sqlalchemy import Vector

class TranscriptSegment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meeting_id: uuid.UUID = Field(foreign_key="meeting.id")
    text: str
    start_time: float
    end_time: float
    # Dimension matches the embedding model (e.g., 1536 for OpenAI)
    embedding: list[float] = Field(sa_type=Vector(1536))
```

## 3. Indexing Strategy
Without an index, `pgvector` performs a brute-force exact nearest neighbor search (scanning every row). This is fine for < 100k rows, but unacceptable at scale.

### HNSW Index
Hierarchical Navigable Small World (HNSW) is the recommended index type for `pgvector` in production. It provides incredibly fast Approximate Nearest Neighbor (ANN) search.

```sql
-- Create an HNSW index using cosine similarity
CREATE INDEX ON transcriptsegment USING hnsw (embedding vector_cosine_ops);
```

**Important considerations for HNSW:**
* The index takes time to build and uses significant RAM.
* Build the index *after* inserting the initial batch of data if possible, though `pgvector` handles rolling updates well.
* Parameter tuning: `m` (max connections per layer, default 16) and `ef_construction` (default 64). The defaults are usually sufficient for standard RAG use cases.

## 4. Querying (Retrieval)
The primary RAG operation is finding segments similar to a query vector, filtered by workspace to ensure security.

### SQLAlchemy Query Example
```python
from sqlalchemy import select
from pgvector.sqlalchemy import Vector

# query_vector is obtained by passing the user's question to the embedding model
query_vector = get_embedding("What was the budget decision?")

stmt = (
    select(TranscriptSegment, Meeting)
    .join(Meeting)
    .where(Meeting.workspace_id == current_user.workspace_id) # CRITICAL: Security filter
    # Optionally filter by specific meeting IDs if the user selected them in the UI
    # .where(Meeting.id.in_(requested_meeting_ids))
    .order_by(TranscriptSegment.embedding.cosine_distance(query_vector))
    .limit(10)
)

results = await session.execute(stmt)
```

## 5. Distance Metrics
* **Cosine Distance (`vector_cosine_ops` / `<=>`):** Best for OpenAI embeddings and most modern sentence transformers. Measures angle, independent of magnitude.
* **L2 Distance (`vector_l2_ops` / `<->`):** Euclidean distance.
* **Inner Product (`vector_ip_ops` / `<#>`):** Slightly faster if the vectors are strictly normalized to length 1.

*MeetingMind Standard:* Use **Cosine Distance**.

## 6. Maintenance & Performance
* Unlike some managed vector databases, PostgreSQL memory management applies here. Ensure `shared_buffers` is large enough to hold the HNSW index in memory.
* Periodically `VACUUM` the table if there are many deletions, though meeting transcripts are mostly append-only.
* If a workspace hits millions of rows and search slows down, consider partitioning the `TranscriptSegment` table by `workspace_id`.
