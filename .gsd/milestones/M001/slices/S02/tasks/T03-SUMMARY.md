---
id: T03
parent: S02
milestone: M001
key_files:
  - apps/api/src/scheduler/miss-detector.ts
  - apps/api/src/index.ts
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-05-12T08:43:20.541Z
blocker_discovered: false
---

# T03: Miss detection scheduler with grace→down state transitions

**Miss detection scheduler with grace→down state transitions**

## What Happened

Retroactive completion (commit f0d65b9). 30s setInterval polling, FOR UPDATE SKIP LOCKED, up→grace→down transitions, advances nextExpectedPingAt for stale down monitors.

## Verification

tsc --noEmit clean, miss-detector.test.ts passing.

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

- `apps/api/src/scheduler/miss-detector.ts`
- `apps/api/src/index.ts`
