---
id: T01
parent: S02
milestone: M001
key_files:
  - apps/api/src/lib/cron.ts
  - apps/api/src/routes/monitors.ts
  - apps/api/src/routes/ping.ts
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-05-12T08:43:14.719Z
blocker_discovered: false
---

# T01: Extracted computeNextExpected into shared apps/api/src/lib/cron.ts

**Extracted computeNextExpected into shared apps/api/src/lib/cron.ts**

## What Happened

Retroactive completion. Cron utility extracted to apps/api/src/lib/cron.ts; monitors.ts and ping.ts updated to import from it. Single source of truth established.

## Verification

tsc --noEmit clean, vitest 37/37 passing.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | pass | 0ms |
| 2 | `npx vitest run` | 0 | pass | 6670ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/api/src/lib/cron.ts`
- `apps/api/src/routes/monitors.ts`
- `apps/api/src/routes/ping.ts`
