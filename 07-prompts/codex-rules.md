---
Title: MeetingMind — Prompts: Codex/General AI Rules
Version: 1.0.0
Status: Approved
Owner: Lead Developer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind: General AI/Codex Rules

## 1. Overview
This document contains generalized prompt snippets for use with tools like OpenAI's ChatGPT, Codex, or other general-purpose LLMs when you don't have the ability to set persistent project-level instructions (like `.cursorrules`).

## 2. The "System Context" Pre-Prompt

Copy and paste this at the start of your conversation before asking for code:

> **System Context:** I am working on a project called MeetingMind. The frontend uses Next.js 15 (App Router), React, TypeScript, Tailwind CSS, and shadcn/ui. The backend uses FastAPI (Python), SQLAlchemy (async), Celery, and PostgreSQL with pgvector. Please remember this stack for all subsequent responses. Do not use legacy technologies like React Class Components or the Next.js Pages router.

## 3. Refactoring Prompts

When you have messy code that you want the AI to clean up according to MeetingMind standards:

> **Refactor Prompt:** "Refactor the following React component. 
> 1. Ensure it uses TypeScript interfaces for props. 
> 2. Replace any raw CSS or styled-components with Tailwind CSS utility classes. 
> 3. If there are standard UI elements (like buttons or dialogs), assume I have the shadcn/ui components imported and use those instead of raw HTML elements.
> 4. Ensure it works in both light and dark mode."

## 4. Debugging Prompts

When pasting error logs:

> **Debug Prompt:** "I am getting the following error in my MeetingMind FastAPI backend. Remember that I am using AsyncSession with SQLAlchemy and PostgreSQL. Based on this traceback, what is the most likely cause, and what is the code to fix it?"
