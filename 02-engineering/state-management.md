---
Title: MeetingMind — State Management
Version: 1.0.0
Status: Approved
Owner: Lead Frontend Engineer
Last Updated: 2026-06-28
Dependencies: 01-product/prd.md
---

# MeetingMind — State Management Architecture

The Next.js frontend employs a strict separation between server state, client state, URL state, and form state. Mixing these domains is the leading cause of bugs and performance degradation in React applications.

## 1. Server State (TanStack Query v5)

Server state is data that lives on the backend and is fetched by the frontend. **Do not put server data into global client stores (e.g., Zustand or Redux).**

We use **TanStack Query (React Query)** to handle fetching, caching, synchronization, and optimistic updates.

### Query Keys Factory Pattern
Always use a centralized query key factory to prevent typos and ensure cache invalidation works correctly.

```typescript
// lib/query-keys.ts
export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (filters: string) => [...meetingKeys.lists(), { filters }] as const,
  details: () => [...meetingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
};
```

### Prefetching in Next.js App Router
Prefetch data in Server Components, then pass the dehydrated state to Client Components.

```tsx
// app/meetings/page.tsx (Server Component)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function MeetingsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: meetingKeys.lists(),
    queryFn: fetchMeetings,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MeetingListClient />
    </HydrationBoundary>
  );
}
```

## 2. Client State (Zustand)

Client state is data that lives entirely in the browser (e.g., UI toggles, active modals, media player state). We use **Zustand** for lightweight, boilerplate-free global state.

```typescript
// stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeMeetingTab: 'summary' | 'transcript' | 'actions';
  setActiveMeetingTab: (tab: 'summary' | 'transcript' | 'actions') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activeMeetingTab: 'summary',
  setActiveMeetingTab: (tab) => set({ activeMeetingTab: tab }),
}));
```

## 3. URL State (Next.js Navigation)

State that determines what the user sees upon refreshing the page or sharing a link MUST be stored in the URL as query parameters, not in Zustand.

* **Examples:** Pagination, search filters, selected sort order.
* **Implementation:** Use Next.js `useRouter` and `useSearchParams`.

```tsx
"use client"
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function StatusFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.push(`${pathname}?${params.toString()}`);
  };

  // ...
}
```

## 4. Form State (React Hook Form + Zod)

Complex forms use React Hook Form for uncontrolled component performance, and Zod for schema validation.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const uploadSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  date: z.date(),
});

export function UploadForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = (data) => {
    // Mutation via React Query
  };
  // ...
}
```
