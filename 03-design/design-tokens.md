---
Title: MeetingMind — Design Tokens
Version: 1.0.0
Status: Approved
Owner: Lead UX/UI Designer
Last Updated: 2026-06-28
Dependencies: 03-design/design-system.md
---

# MeetingMind — Design Tokens

Design tokens are the visual design atoms of MeetingMind — specifically, they are named entities that store visual design attributes. We use CSS variables for our tokens to allow for dynamic theming (Light/Dark mode).

## 1. Core Token Structure

Tokens in MeetingMind follow a functional naming convention rather than a descriptive one (e.g., `--background` instead of `--white`, `--primary` instead of `--emerald`).

### Global CSS Variables (`app/globals.css`)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 160 84% 39%; /* Emerald 500 */
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 346.8 77.2% 49.8%; /* Rose 600 */
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 160 84% 39%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%; /* Slate 950 */
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 160 84% 39%; /* Emerald 500 */
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 342.8 74.2% 54.8%; /* Rose 500 */
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 160 84% 39%;
  }
}
```

## 2. Token Categories

### 2.1 Surfaces
* `--background`: The absolute lowest layer (body background).
* `--card`: slightly elevated surfaces (cards, panels).
* `--popover`: Highly elevated surfaces (dropdowns, tooltips, dialogs).

### 2.2 Text
* `--foreground`: Default text color (high contrast).
* `--muted-foreground`: Secondary text (metadata, placeholders).

### 2.3 Interactive Elements
* `--primary`: Call to action buttons, active states, progress bars.
* `--secondary`: Secondary actions, subtle tags.
* `--accent`: Hover states on list items or ghost buttons.
* `--destructive`: Delete buttons, error states.

### 2.4 Structure
* `--border`: Borders separating layout areas (sidebar, headers).
* `--input`: Borders for text inputs and selects.
* `--ring`: The focus ring color applied on `:focus-visible`.

## 3. Tailwind Configuration Integration

These variables are mapped directly into `tailwind.config.ts` so they can be used with standard Tailwind utility classes (e.g., `bg-background`, `text-primary`).

```typescript
// tailwind.config.ts snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... (other tokens mapped similarly)
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
}
```
