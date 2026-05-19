import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { Suspense, type ReactElement, type ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
  client?: QueryClient;
}

export function TestProviders({ children, client }: WrapperProps) {
  const qc = client ?? createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <Suspense fallback={<div data-testid="suspense-fallback">loading</div>}>{children}</Suspense>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: { client?: QueryClient } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { client, ...rest } = options;
  const qc = client ?? createTestQueryClient();
  return {
    queryClient: qc,
    ...render(ui, {
      wrapper: ({ children }) => <TestProviders client={qc}>{children}</TestProviders>,
      ...rest,
    }),
  };
}
