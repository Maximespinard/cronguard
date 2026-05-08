---
id: T05
parent: S01
milestone: M001
key_files:
  - apps/api/src/routes/ping.ts
  - apps/api/src/index.ts
key_decisions:
  - (none)
duration: 
verification_result: passed
completed_at: 2026-05-08T13:16:08.252Z
blocker_discovered: false
---

# T05: Ping ingestion endpoint with respond-before-write, LRU cache, and dual rate limiting

**Ping ingestion endpoint with respond-before-write, LRU cache, and dual rate limiting**

## What Happened

Implemented GET/POST /api/ping/:slug — public, no auth required. Responds immediately before DB write via setImmediate for <200ms guarantee. LRU cache (1000 entries, 60s TTL) for slug→monitor lookups. Dual rate limiting: 120/min per IP, 10/min per slug with draft-7 headers. State transitions (new/down/grace → up) with alertSentAt clearing on recovery. Mounted before Clerk middleware in Express stack for minimum overhead.

## Verification

TypeScript (0 errors), ESLint (0 issues), 6/6 tests passing, PR #1 reviewed and merged

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

- `apps/api/src/routes/ping.ts`
- `apps/api/src/index.ts`
