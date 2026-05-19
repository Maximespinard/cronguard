import { UserButton } from '@clerk/clerk-react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Activity, Bell, Menu, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { cn } from '../../lib/utils';

// ─── Navigation items ─────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/monitors' as const, label: 'Monitors', icon: Activity },
  { to: '/alert-channels' as const, label: 'Alert Channels', icon: Bell },
];

// ─── Logo ─────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15">
        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-brand-400"
          />
          <path
            d="M12 8v4l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-300"
          />
          <circle cx="12" cy="12" r="1" fill="currentColor" className="text-brand-400" />
        </svg>
      </div>
      <span className="font-display text-base font-semibold tracking-tight text-zinc-100">
        CronGuard
      </span>
    </div>
  );
}

// ─── Sidebar nav link ─────────────────────────────────────────────

function NavLink({ to, label, icon: Icon }: (typeof NAV_ITEMS)[number]) {
  const routerState = useRouterState();
  const isActive = routerState.location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-brand-500/10 text-brand-400'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive ? 'text-brand-400' : 'text-zinc-500 group-hover:text-zinc-400',
        )}
      />
      {label}
    </Link>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800/60 bg-sidebar-bg lg:flex lg:flex-col">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="border-t border-zinc-800/60 p-4">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-500">Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setMobileOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setMobileOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-zinc-800/60 bg-sidebar-bg animate-slide-in-right">
            <div className="flex h-14 items-center justify-between px-5">
              <Logo />
              <button
                onClick={() => {
                  setMobileOpen(false);
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} {...item} />
              ))}
            </nav>

            <div className="border-t border-zinc-800/60 p-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-zinc-800/60 px-4 lg:hidden">
          <button
            onClick={() => {
              setMobileOpen(true);
            }}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
