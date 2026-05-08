# Codebase Map

Generated: 2026-05-08T13:22:43Z | Files: 47 | Described: 0/47
<!-- gsd:codebase-meta {"generatedAt":"2026-05-08T13:22:43Z","fingerprint":"43de1cc8ff4d6c19b7c2919e3e4b07910940b4ce","fileCount":47,"truncated":false} -->

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
- `apps/api/src/routes/monitors.ts`
- `apps/api/src/routes/ping.ts`
- `apps/api/src/routes/webhooks.ts`

### apps/web/
- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.node.json`
- `apps/web/vite.config.ts`

### apps/web/src/
- `apps/web/src/app.css`
- `apps/web/src/main.tsx`
- `apps/web/src/vite-env.d.ts`

### packages/shared/
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`

### packages/shared/src/
- `packages/shared/src/index.ts`

### packages/shared/src/schemas/
- `packages/shared/src/schemas/index.ts`
- `packages/shared/src/schemas/monitor.ts`
- `packages/shared/src/schemas/ping.ts`

### packages/shared/src/types/
- `packages/shared/src/types/alert.ts`
- `packages/shared/src/types/monitor.ts`
- `packages/shared/src/types/ping.ts`
- `packages/shared/src/types/plan.ts`
