---
Title: MeetingMind — Prompts: UI Generation
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: None
---

# MeetingMind: UI Generation Prompts

## 1. Overview
These are specialized prompts designed to force AI coding assistants to generate UI components that strictly adhere to the MeetingMind design system, preventing hallucinations of random colors or off-brand layouts.

## 2. The Base UI Constraint Prompt
Append this to any request asking for a UI component:

> **Constraint:** 
> - Use Tailwind CSS. 
> - The primary brand color is Emerald (`text-emerald-600`, `bg-emerald-500`, etc.).
> - The background should be neutral (e.g., `bg-white` in light mode, `bg-zinc-950` in dark mode). 
> - Borders should be subtle (`border-zinc-200` / `border-zinc-800`).
> - Use `lucide-react` for icons.
> - Ensure all interactive elements have a visible focus ring (`focus-visible:ring-2 focus-visible:ring-emerald-500`).
> - Use subtle rounded corners (`rounded-lg` or `rounded-xl`).

## 3. Specific Component Prompts

### 3.1 Generating a Dashboard Card
> "Generate a Dashboard Stats Card component for a Meeting Analysis app. It should display a title ('Total Audio Processed'), a large number ('42 hours'), and a small trend indicator (e.g., a green arrow pointing up with '12% this week'). Add a subtle `lucide-react` icon in the top right. Use the Base UI Constraints."

### 3.2 Generating a Chat UI (for RAG)
> "Generate a Chat Interface component. It needs a scrollable message area and a sticky input area at the bottom. Messages from the user should be aligned right and have a neutral gray background. Messages from the AI should be aligned left, have a subtle Emerald background tint, and include a small 'MeetingMind AI' avatar icon. The input area should look like a pill-shaped text field with a send icon on the right."

### 3.3 Generating an Empty State
> "Generate an Empty State component for when a user has no meetings. It should have a large, subtle, grayed-out icon (like a video camera or folder) in the center, a bold `text-lg` heading ('No meetings yet'), and a muted descriptive paragraph. Below the text, include a primary action button ('Connect Extension') and a secondary action ('Import Recording') using the Emerald brand color for the primary action."
