# S03: Dashboard UI

**Goal:** Dashboard UI: Clerk-authenticated React app with monitor CRUD, detail view, and alert channel management via TanStack Router + Query + Tailwind v4.
**Demo:** After this: developer can sign in, see all monitors with live status indicators, create/edit/delete monitors, view ping history timeline, and configure alert channels — all in a polished Tailwind UI.

## Must-Haves

- Developer can sign in, list monitors with status badges, create/edit/delete monitors, view monitor detail, and CRUD alert channels — all wired to the API with type-safe TanStack Query hooks.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Dashboard scaffolding (router, auth, design system)** `est:1h`
  Vite + React app with TanStack Router, Clerk auth, Tailwind v4 design tokens, base UI primitives (button, input, dialog, label, status-badge), app shell layout.
  - Files: `apps/web/src/main.tsx`, `apps/web/src/router.tsx`, `apps/web/src/app.css`, `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/dialog.tsx`, `apps/web/src/components/ui/input.tsx`, `apps/web/src/components/ui/label.tsx`, `apps/web/src/components/ui/status-badge.tsx`, `apps/web/src/components/layout/app-shell.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/lib/api-types.ts`, `apps/web/src/lib/query-keys.ts`
  - Verify: vite build clean, tsc --noEmit clean

- [x] **T02: Monitor list + create dialog** `est:45m`
  Monitors page with list view, status badges, and create-monitor dialog wired to monitors API via useMonitors hook.
  - Files: `apps/web/src/pages/monitors.tsx`, `apps/web/src/components/monitors/monitor-list.tsx`, `apps/web/src/components/monitors/create-monitor-dialog.tsx`, `apps/web/src/hooks/use-monitors.ts`
  - Verify: tsc --noEmit clean, manual: list renders, create works

- [x] **T03: Monitor detail + edit/delete dialogs** `est:45m`
  Monitor detail page showing config, recent pings, and edit/delete dialogs wired to monitor mutation endpoints.
  - Files: `apps/web/src/pages/monitor-detail.tsx`, `apps/web/src/components/monitors/monitor-detail.tsx`, `apps/web/src/components/monitors/edit-monitor-dialog.tsx`
  - Verify: tsc --noEmit clean, manual: detail/edit/delete works

- [x] **T04: Alert channels page + CRUD** `est:30m`
  Alert channels page with list and create-channel dialog wired to alert-channel endpoints from S02.
  - Files: `apps/web/src/pages/alert-channels.tsx`, `apps/web/src/components/alert-channels/alert-channel-list.tsx`, `apps/web/src/components/alert-channels/create-channel-dialog.tsx`, `apps/web/src/hooks/use-alert-channels.ts`
  - Verify: tsc --noEmit clean, manual: list/create works

## Files Likely Touched

- apps/web/src/main.tsx
- apps/web/src/router.tsx
- apps/web/src/app.css
- apps/web/src/components/ui/button.tsx
- apps/web/src/components/ui/dialog.tsx
- apps/web/src/components/ui/input.tsx
- apps/web/src/components/ui/label.tsx
- apps/web/src/components/ui/status-badge.tsx
- apps/web/src/components/layout/app-shell.tsx
- apps/web/src/lib/api.ts
- apps/web/src/lib/api-types.ts
- apps/web/src/lib/query-keys.ts
- apps/web/src/pages/monitors.tsx
- apps/web/src/components/monitors/monitor-list.tsx
- apps/web/src/components/monitors/create-monitor-dialog.tsx
- apps/web/src/hooks/use-monitors.ts
- apps/web/src/pages/monitor-detail.tsx
- apps/web/src/components/monitors/monitor-detail.tsx
- apps/web/src/components/monitors/edit-monitor-dialog.tsx
- apps/web/src/pages/alert-channels.tsx
- apps/web/src/components/alert-channels/alert-channel-list.tsx
- apps/web/src/components/alert-channels/create-channel-dialog.tsx
- apps/web/src/hooks/use-alert-channels.ts
