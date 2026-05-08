# S01: DB Schema, Ping Endpoint & Auth

**Goal:** Developer signs up via Clerk, creates a monitor via API, and pings its unique URL. Ping is recorded in Neon Postgres and visible via API query.
**Demo:** `curl -X POST /api/monitors` (authed) creates a monitor → `curl /api/ping/:slug` records a heartbeat → `GET /api/monitors/:id` shows the monitor with last_ping_at updated.

## Must-Haves

- 6-table Drizzle schema with indexes optimized for miss detection and ping history
- Neon WebSocket pool client with graceful fallback
- Clerk auth middleware protecting all /api/monitors routes with tenant isolation
- Zod validation schemas shared between API and future frontend
- Monitor CRUD (POST/GET/PUT/DELETE) with plan-tier enforcement
- Ping ingestion endpoint responding <200ms with fire-and-forget DB write
- LRU cache for slug lookup, rate limiting per IP and per slug

## Threat Surface

- **Abuse**: Ping endpoint is public — rate limit 120/min per IP, 10/min per slug. Monitor CRUD protected by Clerk JWT.
- **Data exposure**: Monitors scoped to userId — no cross-tenant queries possible. Slug is unguessable (nanoid 21, 126-bit entropy).
- **Input trust**: Ping metadata validated by Zod (10KB max output field). Monitor create/update validated by Zod schemas.

## Requirement Impact

- **Requirements touched**: R001 (ping URL), R004 (CRUD monitors), R006 (Clerk auth + tenant isolation), R008 (cron parsing), R010 (free tier 5 monitors)
- **Re-verify**: N/A — first slice, nothing to regress
- **Decisions revisited**: none

## Proof Level

- This slice proves: integration
- Real runtime required: yes (Neon DB, Clerk auth)
- Human/UAT required: no (API-level verification sufficient)

## Verification

- `npm run typecheck` passes across all workspaces
- `npm run lint` passes across all workspaces
- `cd apps/api && npx drizzle-kit generate` succeeds (schema is valid)
- API server starts without errors: `cd apps/api && timeout 5 npx tsx src/index.ts || true`
- Health endpoint reports DB status: `curl http://localhost:3001/api/health`

## Observability / Diagnostics

- Runtime signals: structured console logs for ping received (slug, source_ip, cache_hit), monitor CRUD (userId, monitorId), DB connection events
- Inspection surfaces: GET /api/health returns `{ status, db, timestamp, version }`
- Failure visibility: DB write failures logged with error message and retry context. Auth failures logged with request path and IP.
- Redaction constraints: no secrets in logs. Clerk tokens never logged.

## Integration Closure

- Upstream surfaces consumed: none (first slice)
- New wiring introduced: Drizzle client → Neon, Clerk middleware → Express, router composition in index.ts
- What remains: S02 (miss detection engine + alert dispatch), S03 (dashboard UI)

## Tasks

- [ ] **T01: Drizzle schema, Neon connection, and migration infrastructure** `est:45m`
  - Why: Foundation for all data persistence — every other task depends on the schema and DB client
  - Files: `apps/api/src/db/schema.ts`, `apps/api/src/db/client.ts`, `apps/api/drizzle.config.ts`, `apps/api/src/index.ts`, `apps/api/package.json`
  - Do: Install drizzle-kit + ws. Define 6 tables (users, monitors, pings, alert_channels, monitor_alert_channels, alerts) with indexes from M001-RESEARCH.md. Create Neon WebSocket pool client (max 5 connections). Update health endpoint to check DB connectivity. Add `db:generate` and `db:migrate` npm scripts.
  - Verify: `npm run typecheck && cd apps/api && npx drizzle-kit generate`
  - Done when: Schema file defines all 6 tables, DB client connects via Neon WebSocket, migration SQL generated, health endpoint reports DB status

- [ ] **T02: Clerk auth middleware and tenant-isolated request context** `est:25m`
  - Why: Multi-tenant SaaS requires auth boundaries — users must only see their own monitors
  - Files: `apps/api/src/middleware/auth.ts`, `apps/api/src/types.ts`, `apps/api/src/index.ts`
  - Do: Wire @clerk/express clerkMiddleware(). Create requireAuth middleware extracting userId from Clerk session. Type AuthenticatedRequest. Apply to /api/monitors/* routes. Leave /api/ping/:slug and /api/health unprotected.
  - Verify: `npm run typecheck && npm run lint`
  - Done when: Protected routes return 401 without valid Clerk JWT. UserId available on authenticated requests.

- [ ] **T03: Shared Zod schemas for runtime validation** `est:20m`
  - Why: Single source of truth for API request validation and future frontend form validation
  - Files: `packages/shared/src/schemas/monitor.ts`, `packages/shared/src/schemas/ping.ts`, `packages/shared/src/schemas/index.ts`, `packages/shared/src/index.ts`, `packages/shared/package.json`
  - Do: Add zod to shared package. Create createMonitorSchema (name required, schedule as valid cron, gracePeriod 1-60 default 5, timezone from IANA). Create updateMonitorSchema (all optional). Create pingMetadataSchema (status, duration, exitCode, output max 10KB, env, host). Export from @cronguard/shared.
  - Verify: `npm run typecheck && npm run lint`
  - Done when: Zod schemas exported, type inference matches existing interfaces

- [ ] **T04: Monitor CRUD API endpoints with plan-tier enforcement** `est:40m`
  - Why: Core user interaction — creating and managing monitors
  - Files: `apps/api/src/routes/monitors.ts`, `apps/api/src/index.ts`, `apps/api/package.json`
  - Do: Install nanoid. POST /api/monitors: validate with Zod, generate nanoid slug, compute next_expected_ping_at via cron-parser, enforce PLAN_LIMITS monitor count, insert into DB. GET /api/monitors: list user's monitors. GET /api/monitors/:id: detail with recent pings. PUT /api/monitors/:id: update fields, recompute schedule if changed. DELETE /api/monitors/:id: delete monitor and associated data. All routes use requireAuth, scope queries by userId.
  - Verify: `npm run typecheck && npm run lint`
  - Done when: All 5 CRUD endpoints work with auth, validation, and plan-tier enforcement

- [ ] **T05: Ping ingestion endpoint with respond-before-write and LRU cache** `est:40m`
  - Why: The core product loop — developers add this URL to cron jobs
  - Files: `apps/api/src/routes/ping.ts`, `apps/api/src/index.ts`, `apps/api/package.json`
  - Do: Install lru-cache + express-rate-limit. GET/POST /api/ping/:slug — no auth. LRU cache for slug→monitor lookup (1000 entries, 60s TTL). Respond immediately with {ok:true}, then fire-and-forget via setImmediate: insert ping record, update monitor last_ping_at + status (new→up, down→up recovery). Parse metadata from query params (GET) or JSON body (POST), validate with Zod. Rate limit: 120/min per IP, 10/min per slug. Unknown slug returns 404.
  - Verify: `npm run typecheck && npm run lint`
  - Done when: Ping endpoint responds <200ms, records ping in DB, updates monitor status, cache and rate limiting work

## Files Likely Touched

- `apps/api/src/db/schema.ts`
- `apps/api/src/db/client.ts`
- `apps/api/drizzle.config.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/types.ts`
- `apps/api/src/routes/monitors.ts`
- `apps/api/src/routes/ping.ts`
- `apps/api/src/index.ts`
- `apps/api/package.json`
- `packages/shared/src/schemas/monitor.ts`
- `packages/shared/src/schemas/ping.ts`
- `packages/shared/src/schemas/index.ts`
- `packages/shared/src/index.ts`
- `packages/shared/package.json`
