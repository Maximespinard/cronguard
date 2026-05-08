---
id: T01
parent: S01
milestone: M001
key_files:
  - apps/api/src/db/schema.ts
  - apps/api/src/db/client.ts
  - apps/api/src/db/index.ts
  - apps/api/drizzle.config.ts
  - apps/api/Dockerfile
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-05-08T13:15:47.298Z
blocker_discovered: false
---

# T01: Drizzle schema (6 tables), Neon WebSocket client, migration infrastructure, Dockerfile

**Drizzle schema (6 tables), Neon WebSocket client, migration infrastructure, Dockerfile**

## What Happened

Created the full 6-table Drizzle schema (users, monitors, pings, alert_channels, monitor_alert_channels, alerts) with indexes optimized for miss detection queries. Set up Neon serverless WebSocket pool client with graceful connection handling. Added migration infrastructure via drizzle-kit. Included Dockerfile for Railway deployment from day 1. Health endpoint at /health for readiness checks.

## Verification

TypeScript compilation (0 errors), ESLint (0 issues), schema validates against Drizzle ORM types

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | pass | 3000ms |
| 2 | `npx eslint .` | 0 | pass | 2000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/api/src/db/schema.ts`
- `apps/api/src/db/client.ts`
- `apps/api/src/db/index.ts`
- `apps/api/drizzle.config.ts`
- `apps/api/Dockerfile`
