---
id: S01
parent: M001
milestone: M001
provides:
  - ["Authenticated monitor CRUD API", "Public ping ingestion endpoint", "6-table Drizzle schema with miss detection indexes", "Shared Zod validation schemas", "Clerk auth middleware with tenant isolation"]
requires:
  []
affects:
  []
key_files:
  - ["apps/api/src/db/schema.ts", "apps/api/src/db/client.ts", "apps/api/src/middleware/auth.ts", "apps/api/src/routes/monitors.ts", "apps/api/src/routes/ping.ts", "apps/api/src/routes/webhooks.ts", "packages/shared/src/schemas/monitor.ts", "packages/shared/src/schemas/ping.ts"]
key_decisions:
  - ["D013: Neon WebSocket pool for API routes", "D009: Respond before DB write for ping endpoint", "D010: nanoid 21-char slugs as bearer tokens", "D014: Railway deployment platform"]
patterns_established:
  - ["Tenant isolation via userId from Clerk JWT on all protected routes", "Shared Zod schemas in packages/shared consumed by API routes", "Fire-and-forget DB writes for latency-sensitive endpoints", "LRU cache for hot-path lookups", "Express route params cast to string for Drizzle eq() compatibility"]
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-05-08T13:16:37.075Z
blocker_discovered: false
---

# S01: DB Schema, Ping Endpoint & Auth

**Full API foundation: 6-table Drizzle schema, Clerk auth with tenant isolation, monitor CRUD with plan-tier enforcement, and ping ingestion with <200ms response guarantee**

## What Happened

S01 delivered the complete API backend for CronGuard in 5 tasks across a single feature branch, squash-merged as PR #1.

T01 established the data layer: 6-table Drizzle schema (users, monitors, pings, alert_channels, monitor_alert_channels, alerts) with indexes optimized for miss detection queries, Neon WebSocket pool client, and migration infrastructure. Dockerfile included from day 1 for Railway deployment.

T02 added Clerk JWT verification middleware (requireAuth) for tenant isolation via userId. Webhook endpoint with Svix signature verification handles user lifecycle events. 6 unit tests cover the auth middleware.

T03 created shared Zod schemas in packages/shared for monitor and ping validation, importable by both API and future frontend.

T04 implemented full monitor CRUD (POST/GET/PUT/DELETE) with plan-tier enforcement (free: 5, pro: 50, team: 200). All routes tenant-isolated via userId from auth middleware.

T05 delivered the ping ingestion endpoint (GET/POST /api/ping/:slug) — public, no auth. Responds before DB write for <200ms guarantee. LRU cache (1000 entries, 60s TTL) for slug lookups. Dual rate limiting (120/min per IP, 10/min per slug). State machine transitions on ping receipt.

## Verification

Full workspace verification: TypeScript 0 errors, ESLint 0 issues, 6/6 tests passing. PR #1 code-reviewed (security, performance, type safety) and squash-merged to main.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

Extract computeNextExpected (duplicated in monitors.ts and ping.ts) into shared utility when touching either file. Broaden test coverage beyond auth middleware. LRU cache not invalidated on monitor updates (60s TTL is acceptable for now).

## Files Created/Modified

- `apps/api/src/db/schema.ts` — 6-table Drizzle schema with indexes
- `apps/api/src/db/client.ts` — Neon WebSocket pool client
- `apps/api/src/middleware/auth.ts` — Clerk JWT verification middleware
- `apps/api/src/routes/monitors.ts` — Monitor CRUD with plan-tier enforcement
- `apps/api/src/routes/ping.ts` — Ping ingestion with LRU cache and rate limiting
- `apps/api/src/routes/webhooks.ts` — Clerk webhook user sync via Svix
- `packages/shared/src/schemas/monitor.ts` — Zod schemas for monitor create/update
- `packages/shared/src/schemas/ping.ts` — Zod schemas for ping ingestion
