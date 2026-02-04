import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000,        // 30 minutes - garbage collection time
      refetchOnWindowFocus: false,   // Don't refetch when window regains focus
      retry: 2,                       // Retry failed requests twice
      refetchOnMount: false,         // Don't refetch on component mount if data exists
    },
  },
});
