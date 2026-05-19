# Codebase Map

Generated: 2026-05-12T10:49:52Z | Files: 86 | Described: 0/86
<!-- gsd:codebase-meta {"generatedAt":"2026-05-12T10:49:52Z","fingerprint":"79a9a3def7c22f84153c63bb46d0e89249d73823","fileCount":86,"truncated":false} -->

### (root)/
- `.env.example`
- `.gitignore`
- `.lintstagedrc.json`
- `.prettierignore`
- `.prettierrc`
- `commitlint.config.js`
- `eslint.config.js`
- `package-lock.json`
- `package.json`
- `tsconfig.base.json`
- `tsconfig.json`

### .github/workflows/
- `.github/workflows/ci.yml`

### .husky/
- `.husky/commit-msg`
- `.husky/pre-commit`

### apps/api/
- `apps/api/Dockerfile`
- `apps/api/drizzle.config.ts`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/vitest.config.ts`

### apps/api/src/
- `apps/api/src/index.ts`

### apps/api/src/db/
- `apps/api/src/db/client.ts`
- `apps/api/src/db/index.ts`
- `apps/api/src/db/schema.ts`

### apps/api/src/lib/
- `apps/api/src/lib/cron.ts`

### apps/api/src/middleware/
- `apps/api/src/middleware/auth.test.ts`
- `apps/api/src/middleware/auth.ts`

### apps/api/src/routes/
- `apps/api/src/routes/alert-channels.ts`
- `apps/api/src/routes/monitors.ts`
- `apps/api/src/routes/ping.ts`
- `apps/api/src/routes/webhooks.ts`

### apps/api/src/scheduler/
- `apps/api/src/scheduler/dispatcher.test.ts`
- `apps/api/src/scheduler/dispatcher.ts`
- `apps/api/src/scheduler/formatters.test.ts`
- `apps/api/src/scheduler/formatters.ts`
- `apps/api/src/scheduler/integration.test.ts`
- `apps/api/src/scheduler/miss-detector.test.ts`
- `apps/api/src/scheduler/miss-detector.ts`

### apps/web/
- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.node.json`
- `apps/web/vite.config.ts`
- `apps/web/vitest.config.ts`

### apps/web/src/
- `apps/web/src/app.css`
- `apps/web/src/main.tsx`
- `apps/web/src/router.tsx`
- `apps/web/src/vite-env.d.ts`

### apps/web/src/components/alert-channels/
- `apps/web/src/components/alert-channels/alert-channel-list.test.tsx`
- `apps/web/src/components/alert-channels/alert-channel-list.tsx`
- `apps/web/src/components/alert-channels/create-channel-dialog.tsx`

### apps/web/src/components/layout/
- `apps/web/src/components/layout/app-shell.tsx`

### apps/web/src/components/monitors/
- `apps/web/src/components/monitors/create-monitor-dialog.test.tsx`
- `apps/web/src/components/monitors/create-monitor-dialog.tsx`
- `apps/web/src/components/monitors/edit-monitor-dialog.tsx`
- `apps/web/src/components/monitors/monitor-detail.tsx`
- `apps/web/src/components/monitors/monitor-list.test.tsx`
- `apps/web/src/components/monitors/monitor-list.tsx`

### apps/web/src/components/ui/
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/label.tsx`
- `apps/web/src/components/ui/status-badge.tsx`

### apps/web/src/hooks/
- `apps/web/src/hooks/use-alert-channels.ts`
- `apps/web/src/hooks/use-monitors.ts`

### apps/web/src/lib/
- `apps/web/src/lib/api-types.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/query-keys.ts`
- `apps/web/src/lib/utils.ts`

### apps/web/src/pages/
- `apps/web/src/pages/alert-channels.tsx`
- `apps/web/src/pages/monitor-detail.tsx`
- `apps/web/src/pages/monitors.tsx`
- `apps/web/src/pages/sign-in.tsx`

### apps/web/src/test/
- `apps/web/src/test/fixtures.ts`
- `apps/web/src/test/setup.ts`
- `apps/web/src/test/utils.tsx`

### packages/shared/
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`

### packages/shared/src/
- `packages/shared/src/index.ts`

### packages/shared/src/schemas/
- `packages/shared/src/schemas/alert-channel.ts`
- `packages/shared/src/schemas/index.ts`
- `packages/shared/src/schemas/monitor.ts`
- `packages/shared/src/schemas/ping.ts`

### packages/shared/src/types/
- `packages/shared/src/types/alert.ts`
- `packages/shared/src/types/monitor.ts`
- `packages/shared/src/types/ping.ts`
- `packages/shared/src/types/plan.ts`
