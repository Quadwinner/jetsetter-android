import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for the app.
 *
 * Defaults tuned for a mobile client on flaky networks:
 *  - staleTime 60s     → don't refetch the same data on every remount/navigation
 *  - gcTime 30m        → keep results around so back-navigation is instant
 *  - retry 2           → tolerate transient mobile network blips
 *  - refetchOnWindowFocus false → there is no browser "window focus" in RN
 *    (screen-focus refetching is opted into per-hook where it matters)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
