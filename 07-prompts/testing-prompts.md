---
Title: MeetingMind — Prompts: Testing Generation
Version: 1.0.0
Status: Approved
Owner: QA Engineer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind: Testing Generation Prompts

## 1. Overview
Writing tests is tedious. These prompts help you instruct AI assistants to generate boilerplate tests for MeetingMind, saving significant development time.

## 2. Frontend Unit Test Prompt (Vitest)
> "Write a Vitest / React Testing Library suite for the following React component. 
> [Paste Component Code Here]
> 
> Constraints:
> 1. Test that it renders without crashing.
> 2. Test the primary user interaction (e.g., clicking the main button).
> 3. If it accepts a data array as a prop, test what happens when the array is empty vs when it has 3 items.
> 4. Mock any `lucide-react` icons to prevent SVG rendering issues in tests."

## 3. Backend API Test Prompt (pytest)
> "Write a pytest suite for the following FastAPI endpoint.
> [Paste Endpoint Code Here]
>
> Constraints:
> 1. Use FastAPI's `TestClient`.
> 2. Assume I have a pytest fixture called `db_session` that provides an ephemeral database, and `auth_headers` that provides a valid JWT.
> 3. Write a test for the 200 OK happy path.
> 4. Write a test asserting that a 403 Forbidden is returned if `auth_headers` is missing.
> 5. Write a test asserting that a 422 Unprocessable Entity is returned if the request JSON is missing a required field."

## 4. E2E Test Prompt (Playwright)
> "Write a Playwright E2E test script for a 'User Registration' flow.
> 
> Constraints:
> 1. Navigate to `/register`.
> 2. Fill in the 'Email' and 'Password' inputs.
> 3. Click the 'Create Account' button.
> 4. Assert that the page redirects to `/dashboard` and that the text 'Welcome to MeetingMind' is visible.
> 5. Use `getByRole` and `getByText` locators instead of CSS selectors where possible."

## 5. Mock Data Generation
Need dummy data for your tests? Use this prompt:

> "Generate a JSON array of 5 mock `TranscriptSegment` objects. 
> Each object should have: 
> - `id` (UUID)
> - `speaker_name` (string, alternate between 'Alex' and 'Maya')
> - `start_time` (float)
> - `end_time` (float)
> - `text` (a realistic sentence from a marketing meeting). 
> Ensure the timestamps are strictly chronological and make sense."
