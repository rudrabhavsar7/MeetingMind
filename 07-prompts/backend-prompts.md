---
Title: MeetingMind — Prompts: Backend Generation
Version: 1.1.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-07-11
Dependencies: 04-backend/data-dictionary.md, 04-backend/rag-architecture.md
---

# MeetingMind: Backend Generation Prompts

## 1. Overview
These prompts are designed to guide AI assistants to write backend Python code that adheres to MeetingMind's specific architectural choices (Async FastAPI, Celery, pgvector).

## 2. Generating a Database Model
> "Write a SQLAlchemy (SQLModel) definition for a `[EntityName]` table in PostgreSQL.
> - Ensure the primary key is a UUID (UUIDv4 default).
> - Include `created_at` and `updated_at` timestamps.
> - If the table relates to a workspace, include a `workspace_id` foreign key.
> - Use Python type hints."

## 3. Generating a Celery Task
> "Write a Celery task for the MeetingMind backend. 
> - The task is named `[TaskName]`.
> - It should accept a `meeting_id` string as an argument.
> - Include standard Celery `@celery_app.task` decorator with `bind=True`.
> - Include a try/except block. If it fails, log the error using the `logging` module and update the database meeting status to 'FAILED'.
> - Ensure the database session is instantiated safely inside the task context."

## 4. Generating a RAG Query (pgvector)
> "Write an asynchronous SQLAlchemy query using `pgvector`.
> - I have a `TranscriptChunk` table with an `embedding` column (type `Vector(768)`) and segment-boundary metadata.
> - I have a `query_vector` array of floats.
> - Write a query that finds the top 5 chunks using Cosine Distance (`cosine_distance`).
> - CRITICAL: Filter `TranscriptChunk.workspace_id` by the authenticated workspace and verify meeting membership to prevent data leakage.
> - Return citation metadata that can resolve the chunk back to its exact source transcript segments."

## 5. Generating an LLM Prompt Wrapper
> "Write an async Python provider adapter for the configured MeetingMind LLM. Use the local Ollama-compatible provider by default; do not require an external API key.
> - The function should be async.
> - It takes a `transcript_text` string and returns a Pydantic model called `MeetingSummary` (which you should also define).
> - Request structured JSON and validate it with the Pydantic model; do not trust raw model output.
> - Return the configured provider/model identifiers so the caller can persist `AIProcessingRun` lineage.
> - Handle timeout, unavailable-model, invalid-output, and retryable provider errors without logging meeting content.
> - Treat external providers as optional operator-enabled adapters only."
