import { useAuth } from '@clerk/clerk-react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from '@tanstack/react-router';

import { AppShell } from './components/layout/app-shell';
import { AlertChannelsPage } from './pages/alert-channels';
import { MonitorDetailPage } from './pages/monitor-detail';
import { MonitorsPage } from './pages/monitors';
import { SignInPage } from './pages/sign-in';

// ─── Root route ───────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: Outlet,
});

// ─── Auth layout (pathless) ───────────────────────────────────────

function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

const authLayout = createRoute({
  id: 'auth',
  getParentRoute: () => rootRoute,
  component: AuthLayout,
});

// ─── Public routes ────────────────────────────────────────────────

function IndexPage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/monitors" />;
  }

  return <Navigate to="/sign-in" />;
}

const indexRoute = createRoute({
  path: '/',
  getParentRoute: () => rootRoute,
  component: IndexPage,
});

const signInRoute = createRoute({
  path: '/sign-in',
  getParentRoute: () => rootRoute,
  component: SignInPage,
});

// ─── Protected routes ─────────────────────────────────────────────

const monitorsRoute = createRoute({
  path: '/monitors',
  getParentRoute: () => authLayout,
  component: MonitorsPage,
});

const monitorDetailRoute = createRoute({
  path: '/monitors/$id',
  getParentRoute: () => authLayout,
  component: MonitorDetailPage,
});

const alertChannelsRoute = createRoute({
  path: '/alert-channels',
  getParentRoute: () => authLayout,
  component: AlertChannelsPage,
});

// ─── Route tree ───────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  authLayout.addChildren([monitorsRoute, monitorDetailRoute, alertChannelsRoute]),
]);

// ─── Router instance ──────────────────────────────────────────────

export const router = createRouter({ routeTree });

// ─── Type registration ────────────────────────────────────────────

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
