import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import './app.css';
import { setAuthTokenProvider } from './lib/api';
import { router } from './router';

// ─── Clerk ────────────────────────────────────────────────────────

function getClerkKey(): string {
  const key = import.meta.env['VITE_CLERK_PUBLISHABLE_KEY'] as string | undefined;
  if (!key) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
  }
  return key;
}

const CLERK_KEY = getClerkKey();

// ─── Query Client ─────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

// ─── Auth Bridge ──────────────────────────────────────────────────
// Connects Clerk's getToken to the API client

function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenProvider(() => getToken());
  }, [getToken]);

  return null;
}

// ─── App ──────────────────────────────────────────────────────────

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthBridge />
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// ─── Mount ────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
