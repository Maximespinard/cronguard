---
id: T04
parent: S01
milestone: M001
key_files:
  - apps/api/src/routes/monitors.ts
  - apps/api/src/index.ts
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-05-08T13:16:02.492Z
blocker_discovered: false
---

# T04: Monitor CRUD endpoints (POST/GET/PUT/DELETE) with plan-tier enforcement

**Monitor CRUD endpoints (POST/GET/PUT/DELETE) with plan-tier enforcement**

## What Happened

Implemented full CRUD on /api/monitors with Clerk auth and userId tenant isolation. POST enforces plan-tier monitor limits (free: 5, pro: 50, team: 200). GET returns user's monitors only. PUT/DELETE verify ownership before mutation. All inputs validated via shared Zod schemas. Fixed TS issues: Express params typing (string union → cast) and non-null assertions replaced with runtime guards.

## Verification

TypeScript (0 errors), ESLint (0 issues), 6/6 tests passing

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | pass | 3000ms |
| 2 | `npx vitest run` | 0 | pass (6/6) | 2500ms |
| 3 | `npx eslint .` | 0 | pass | 2000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/api/src/routes/monitors.ts`
- `apps/api/src/index.ts`
