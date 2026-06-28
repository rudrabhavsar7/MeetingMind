---
Title: MeetingMind — Backend: RAG Architecture
Version: 1.0.0
Status: Approved
Owner: AI Engineer
Last Updated: 2026-06-28
Dependencies: 04-backend/vector-database.md
---

# MeetingMind Backend: RAG Architecture

## 1. Overview
Retrieval-Augmented Generation (RAG) is the mechanism that allows users to ask an LLM questions about their specific meeting transcripts (e.g., "What did we decide about the marketing budget?"). The LLM does not inherently "know" the meeting; we must retrieve the relevant context and inject it into the prompt.

## 2. The Problem
An LLM has a limited Context Window (e.g., 8k or 128k tokens). A user might have hundreds of hours of meetings in their workspace. We cannot put all transcripts into the prompt.

## 3. The RAG Flow

### Phase 1: Ingestion (During Meeting Processing)
1. The raw transcript is divided into "Chunks".
   * *Strategy:* Chunk by speaker segment, or if a segment is too long, chunk by overlapping rolling windows (e.g., 500 characters, 100 character overlap).
2. Each chunk is passed to an Embedding Model (e.g., `text-embedding-3-small` or local `nomic-embed-text`).
3. The resulting vector (array of floats) is saved to the `TranscriptSegments` table in PostgreSQL alongside the original text.

### Phase 2: Retrieval (When user asks a question)
1. **User Query:** User asks "What is the marketing budget?"
2. **Query Vectorization:** The backend passes the user's question through the *exact same* Embedding Model to get a Query Vector.
3. **Similarity Search:** The backend queries PostgreSQL (`pgvector`) to find the top K chunks in the database whose vectors are closest (cosine similarity) to the Query Vector.
   * *Crucial:* The SQL query MUST filter by `workspace_id` to prevent data leakage.
4. **Context Assembly:** The backend retrieves the raw text of those top K chunks.

### Phase 3: Generation
1. **Prompt Construction:** The backend builds a prompt combining the retrieved context and the user's question.
2. **LLM Call:** The LLM generates the answer.
3. **Streaming Response:** The answer is streamed back to the frontend.

## 4. Prompt Template Example

```text
You are an intelligent assistant for MeetingMind. 
Answer the user's question based ONLY on the following meeting transcript excerpts.
If the answer is not contained within the excerpts, say "I don't have enough information to answer that."
Do not hallucinate.

When you use a fact from the context, you must cite the start_time provided in the format <cite>start_time</cite>.

CONTEXT:
{context_chunks}

USER QUESTION: 
{user_query}
```

## 5. Context Formatting
When injecting `{context_chunks}`, include metadata so the LLM understands who is speaking and when.

```text
[Meeting: Q3 Planning] [Timestamp: 14:05] [Speaker: Alex]: We need to cap the marketing budget at $50k.
[Meeting: Q3 Planning] [Timestamp: 14:10] [Speaker: Maya]: Agreed, $50k is the absolute limit.
```

## 6. Advanced RAG Techniques (Future Implementation)
* **Hybrid Search:** Combine Vector Search (Semantic) with BM25 Keyword Search (Lexical) using PostgreSQL Full-Text Search. This helps with exact-match queries like "Jira ticket PROJ-123", which vectors sometimes struggle with.
* **Query Rephrasing:** If the user asks a follow-up question ("Why did they say that?"), first pass the chat history to a small LLM to rephrase the query into a standalone query ("Why did Alex cap the budget at $50k?") *before* doing the vector search.
* **Context Window Expansion:** Instead of just returning the matched chunk, return the chunk *plus* the chunk immediately before and after it to give the LLM more conversational context.
