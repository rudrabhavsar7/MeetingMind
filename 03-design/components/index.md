---
Title: MeetingMind — Components Index
Version: 1.0.0
Status: Approved
Owner: Lead UX Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-system.md
---

# MeetingMind — Components Index

This directory contains the exhaustive specifications for all reusable UI components within the MeetingMind application. 

## Component Architecture Philosophy

MeetingMind components are built using:
1. **React 19**
2. **Tailwind CSS v4**
3. **Radix UI** (for accessible primitives)
4. **shadcn/ui** (as the base implementation pattern)

## The 42-Section Standard

To ensure absolute clarity between Design, Product, and Engineering, every individual component document in this directory adheres to a strict 42-section template. This guarantees that all edge cases, accessibility requirements, and AI-integration patterns are considered *before* implementation begins.

## Directory Structure

* `/foundation`: The atomic layer. Buttons, badges, avatars, dividers.
* `/forms`: Inputs, selects, date pickers, switches.
* `/navigation`: Sidebar, tabs, breadcrumbs, command palette.
* `/feedback`: Modals, toasts, tooltips, progress bars.
* `/data-display`: Tables, cards, accordions, charts.
* `/meeting`: Domain-specific components (TranscriptViewer, ActionItemRow).
* `/ai`: RAG-specific components (CitationLink, GenerativeSearchInput).

## Quick Links
* [Button](foundation/button.md)
* [Input](forms/input.md)
* [MeetingCard](../pages/meetings.md) (Domain specific)
