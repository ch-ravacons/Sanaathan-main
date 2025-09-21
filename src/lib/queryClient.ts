import { QueryClient } from '@tanstack/react-query';

type QueryClientFactoryOptions = {
  staleTimeMs?: number;
};

export const createQueryClient = ({ staleTimeMs = 60_000 }: QueryClientFactoryOptions = {}) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: staleTimeMs,
        refetchOnWindowFocus: false,
        retry: 1
      },
      mutations: {
        retry: 1
      }
    }
  });

export const queryClient = createQueryClient();
