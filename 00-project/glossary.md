---
Title: MeetingMind — Glossary
Version: 1.0.0
Status: Approved
Owner: Technical Writing Team
Last Updated: 2026-06-28
Dependencies: None
Related Documents:
  - 00-project/product-overview.md
  - 00-project/vision.md
---

# MeetingMind — Glossary

This document defines the core terminology used across the MeetingMind project. It is intended for engineering, product, design, and operations teams to establish a ubiquitous language.

## Table of Contents
1. [AI & Machine Learning](#1-ai--machine-learning)
2. [Product & User Experience](#2-product--user-experience)
3. [Architecture & Infrastructure](#3-architecture--infrastructure)
4. [Audio & Transcription](#4-audio--transcription)

---

## 1. AI & Machine Learning

**Chunk**
A segment of transcribed text (e.g., 512 tokens) used as a discrete unit for embedding and vector search. Chunks often have overlapping boundaries to preserve context across splits.

**Confidence Score**
A normalized metric (0.0 to 1.0) indicating the model's certainty in its output, such as transcription accuracy or extracted action items. Displayed in the UI as High (≥0.8), Medium (0.6-0.79), or Low (<0.6).

**Cosine Similarity**
The mathematical metric used by the vector database (pgvector) to measure how similar two embeddings are, based on the angle between them in the high-dimensional space.

**DeepSeek**
An open-source family of large language models supported by MeetingMind via Ollama, often utilized for reasoning-heavy extraction tasks.

**Embedding**
A dense vector representation of text (e.g., a meeting chunk). MeetingMind uses BAAI BGE-base-en-v1.5 to generate 768-dimensional embeddings that capture semantic meaning.

**Gemma**
Google's open-weights language model. A supported option in MeetingMind for local inference via Ollama.

**Hallucination**
When an LLM generates plausible but factually incorrect information. MeetingMind mitigates this using RAG, strict prompting, and explicit source citations.

**HNSW (Hierarchical Navigable Small World)**
The index type used in pgvector for fast, approximate nearest-neighbor search over embeddings.

**Inference**
The process of running a trained machine learning model (like Whisper or Llama 3) to generate outputs (transcripts or summaries) from input data.

**LangChain**
The framework used in the backend to orchestrate LLM calls, manage prompts, and assemble the RAG pipeline.

**Llama 3**
Meta's open-weights large language model, the default LLM in MeetingMind for local, privacy-first summarization and extraction tasks.

**LLM (Large Language Model)**
A foundational AI model capable of understanding and generating human-like text.

**MMR (Maximal Marginal Relevance)**
An algorithm used during vector retrieval to balance the relevance of search results with their diversity, preventing the RAG pipeline from receiving repetitive context.

**Ollama**
The inference engine used by MeetingMind to run LLMs locally on the host's infrastructure, ensuring data privacy.

**Prompt**
The precise instruction set passed to the LLM. MeetingMind manages prompts as versioned templates within the LangChain pipeline.

**RAG (Retrieval-Augmented Generation)**
An architecture where the LLM is provided with relevant context retrieved from a vector database (past meetings) to ground its answers in factual, private data.

**SLM (Small Language Model)**
Smaller, highly efficient models designed to run on constrained hardware while still performing specific tasks (like basic extraction) reliably.

**Vector Database**
A database optimized for storing and querying high-dimensional vectors. MeetingMind uses PostgreSQL with the `pgvector` extension.

---

## 2. Product & User Experience

**Action Item**
A specific task identified by the AI during a meeting, containing a description, an assignee, and an implied or explicit due date. 

**Breadcrumb**
A tertiary navigation component that shows the user's current location within the application hierarchy (e.g., Dashboard > Meetings > Q3 Planning).

**Citation**
A UI element linking an AI-generated statement (in a summary or RAG answer) back to the exact meeting and timestamp where it was discussed.

**Command Palette**
A globally accessible search interface (Cmd+K) that allows users to quickly find meetings, action items, or navigate the application.

**Decision**
A formal choice, agreement, or conclusion reached during a meeting, extracted by the AI as a permanent historical record.

**Empty State**
The UI displayed when a view has no data (e.g., no meetings captured/imported, or no search results). Designed to guide the user toward the next logical action.

**Knowledge Base**
The collective, searchable repository of all processed meetings within a Workspace.

**Meeting**
The core data entity in MeetingMind, representing an extension-captured, standalone-captured, imported, or bot-originated session and all its derived intelligence (transcript, summary, actions, decisions).

**MeetingMind Chrome Extension**
The primary v1 capture client. It detects supported meeting apps, captures tab audio with explicit user permission, streams audio to the backend, and shows live transcript/AI status.

**Skeleton**
An animated, shape-based placeholder UI shown while data is loading to reduce perceived latency.

**Toast**
A transient, non-modal notification that appears briefly to inform the user of a success, error, or background process update.

**Topic**
An AI-identified thematic segment of a meeting, complete with a start and end timestamp, representing a distinct phase of the conversation.

**Transcript**
The textual representation of the meeting's audio, segmented by timestamp and attributed to distinct speakers.

**Workspace**
The top-level organizational boundary in MeetingMind. All meetings, members, and data are siloed within a specific workspace.

---

## 3. Architecture & Infrastructure

**Celery**
The asynchronous task queue used by MeetingMind to handle long-running background jobs like audio extraction, transcription, and LLM processing.

**CORS (Cross-Origin Resource Sharing)**
Security policies configured in FastAPI to control which web domains can interact with the MeetingMind API.

**Idempotency**
A property of backend tasks meaning they can be executed multiple times without changing the result beyond the initial application. Crucial for Celery retry logic.

**JWT (JSON Web Token)**
The standard used for stateless authentication. MeetingMind uses short-lived access tokens and secure, HTTP-only refresh tokens.

**MinIO**
The S3-compatible object storage server used in self-hosted deployments to store optional live audio archives, imported recordings, exports, and processed media files.

**pgvector**
An open-source extension for PostgreSQL that adds vector similarity search capabilities, allowing the relational DB to serve as the vector store.

**Presigned URL**
A temporary, secure URL generated by MinIO/S3 that allows the frontend to import recording files directly to storage without passing through the backend API.

**Rate Limiting**
Controls implemented in FastAPI to restrict the number of API requests a user can make within a time window, preventing abuse and resource exhaustion.

**RBAC (Role-Based Access Control)**
The authorization model used to manage permissions. Roles include Owner, Admin, Member, and Viewer.

**Webhook**
An HTTP callback that occurs when something happens in MeetingMind (e.g., a meeting finishes processing), used to integrate with external systems.

---

## 4. Audio & Transcription

**Diarization (Speaker Diarization)**
The process of partitioning an audio stream into homogeneous segments according to speaker identity. Answering the question "Who spoke when?"

**FFmpeg**
The industry-standard multimedia framework used in MeetingMind's pipeline to extract audio, normalize volume, and convert file formats prior to transcription.

**WER (Word Error Rate)**
The standard metric for measuring the accuracy of automatic speech recognition. Calculated as `(Substitutions + Deletions + Insertions) / Total Words`.

**Whisper**
OpenAI's open-source automatic speech recognition (ASR) system. The foundation of MeetingMind's transcription pipeline, running locally for data privacy.
