"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Client-side providers wrapper.
 * Provides TanStack QueryClient to all child components.
 * Created inside a component so Next.js Server Components can still be used for pages.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 30s, stale for 5min
            staleTime: 30_000,
            gcTime: 5 * 60 * 1000,
            // Retry once on failure (backend may be starting up)
            retry: 1,
            retryDelay: 1000,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
