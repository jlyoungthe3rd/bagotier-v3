import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client for immutable local mock data: never stale, one retry
 * to exercise the designed error state without endless spinners.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: 1,
      },
    },
  });
}
