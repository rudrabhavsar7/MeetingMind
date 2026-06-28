---
Title: MeetingMind — AI Search Page
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 01-product/functional-requirements.md
---

# MeetingMind — AI Search Page (`/search`)

The AI Search page is the interface for the RAG (Retrieval-Augmented Generation) pipeline. It allows users to ask natural language questions across their entire organizational knowledge base.

## 1. Page Purpose
To turn passive meeting recordings into a proactive, querying oracle.

## 2. Layout Structure

This page is designed to feel like a modern chat interface, but restricted to a single turn per query (not a continuous conversation thread in v1.0).

* **Header:** Simple, centered title "Ask MeetingMind".
* **Search Input (Hero):** A large, prominent, centered text area (not just a single-line input) with a submit button (`Sparkles` icon).
* **Results Area:** Appears below the input after submission.
  * **Generated Answer:** The streamed markdown response from the LLM.
  * **Sources (Citations):** A grid of cards below the answer showing the exact meetings referenced.

## 3. Interaction Design

### 3.1 The Query Phase
* User types a question: "What did we decide regarding the Q3 budget?"
* User hits `Enter` (or clicks submit).
* The input moves from the center of the screen to the top (sticky), making room for results.

### 3.2 The Generation Phase (Streaming)
* A loading skeleton appears for `< 1.5s` while pgvector retrieval happens.
* Text begins streaming in using Server-Sent Events (SSE). 
* The cursor blinks at the end of the streaming text.

### 3.3 The Verification Phase (Citations)
* The LLM answer includes citation links `[1]`, `[2]`.
* Clicking `[1]` opens a `Dialog` (Modal) overlay.
* **The Modal:** Shows the title of the source meeting, the date, and the specific transcript chunk that provided the context, highlighting the relevant keywords. A button allows navigating to the full `Meeting Details` page.

## 4. Empty States & Suggestions
When the user first lands on the page (before searching):
* Display 3-4 clickable "Suggested Queries" based on recent organizational activity (or randomized templates).
  * *"What were the action items from yesterday's All Hands?"*
  * *"Summarize the debate about the database migration."*

## 5. Error Handling
* **No Context Found:** If the vector search returns zero relevant chunks (similarity score too low), the system bypasses the LLM and instantly returns: *"I couldn't find any discussion regarding that topic in your past meetings."*
* **LLM Timeout:** If Ollama crashes or hangs, display a friendly error: *"The AI engine is currently overloaded. Please try your search again."*
