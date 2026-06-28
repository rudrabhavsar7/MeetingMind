---
Title: MeetingMind — Prompts: Backend Generation
Version: 1.0.0
Status: Approved
Owner: Lead Backend Engineer
Last Updated: 2026-06-28
Dependencies: None
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
> - I have a `TranscriptSegment` table with an `embedding` column (type `Vector(1536)`).
> - I have a `query_vector` array of floats.
> - Write a query that finds the top 5 segments using Cosine Distance (`cosine_distance`).
> - CRITICAL: The query must join the `Meeting` table and filter by a specific `workspace_id` to prevent data leakage."

## 5. Generating an LLM Prompt Wrapper
> "Write a Python utility function using the official `openai` Python SDK.
> - The function should be async.
> - It takes a `transcript_text` string and returns a Pydantic model called `MeetingSummary` (which you should also define).
> - Use the `response_format` parameter to force the LLM to output valid JSON matching the Pydantic model.
> - Handle the `RateLimitError` gracefully."
