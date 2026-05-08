# M001 Research: Foundation & Core Engine

## Research Agents Dispatched

Four parallel research agents investigated the critical architecture domains for M001. All completed successfully with high alignment.

## 1. Database Schema Architecture

### Schema (6 tables)
- **users** — local user row anchored by `clerk_user_id`, stores plan tier and Stripe subscription
- **monitors** — cron job monitors with `slug` (nanoid 21), `schedule`, `grace_period_minutes`, `timezone`, `status` (new/up/grace/down), `next_expected_ping_at` (stored, not computed), `last_ping_at`
- **pings** — immutable append-only heartbeat records with `source_ip`, `duration_ms`, `metadata` (JSONB)
- **alert_channels** — user-level reusable channels (email/slack/discord/webhook) with JSONB `config`
- **monitor_alert_channels** — join table linking monitors to their alert channels
- **alerts** — alert history with `miss_key` unique index for idempotent deduplication

### Critical Indexes
- `monitors_miss_detection_idx` on `(next_expected_ping_at, status) WHERE NOT paused` — the most important index
- `pings_monitor_received_idx` on `(monitor_id, received_at)` — dashboard ping history
- `alerts_monitor_miss_key_uidx` on `(monitor_id, miss_key)` — deduplication via INSERT ON CONFLICT DO NOTHING
- `pings_received_at_idx` — retention pruner

### Neon Driver Strategy
- WebSocket pool (`@neondatabase/serverless` with `ws`) for API routes — keeps connections warm (20-60ms vs 300-500ms cold)
- Pool size: max 5 connections (free tier limit)
- Ping write is fire-and-forget after response, so driver latency is non-critical for that path

### Data Retention
- Pruner runs daily, deletes pings older than plan retention (7d free, 30d pro, 90d team)
- Batch deletes with LIMIT 10000 to prevent lock contention on single compute unit
- Rate limit ping endpoint (10/min per slug) to prevent storage abuse

## 2. Ping Endpoint Architecture

### URL Design
- `GET/POST /api/ping/:slug` — nanoid 21 chars, 126-bit entropy
- Sub-routes: `/ping/:slug/start`, `/ping/:slug/fail` (Healthchecks.io pattern)
- No auth required — slug IS the bearer token

### Performance (<200ms guarantee)
1. LRU cache for monitor slug lookup (1000 entries, 60s TTL) → <1ms on cache hit
2. Respond before DB write (fire-and-forget via `setImmediate`)
3. In-memory write buffer with 3-attempt exponential backoff retry for DB failures
4. Response time budget (cache warm): ~6ms total

### Security
- IP rate limiter: 120 req/min per IP
- Slug rate limiter: 10 req/min per slug
- CORS: `origin: '*'` (public endpoint)
- Helmet headers applied

### Metadata Support
- Zod-validated schema: `status` (success/fail/start), `duration`, `exitCode`, `output` (10KB max), `env`, `host`
- GET: query params. POST: JSON body or text/plain (raw log capture)

## 3. Miss Detection Engine

### Scheduler
- Single `setInterval` at 30s granularity — stateless, restartable, crash-safe
- DB is sole source of truth — no in-memory state
- `FOR UPDATE SKIP LOCKED` prevents double-processing on deployment overlap

### State Machine
```
new → (ping) → up → (expected window passes) → grace → (grace exhausted) → down
down → (ping) → up (recovery alert)
grace → (ping) → up (silent, within acceptable window)
```

### Alert Dispatch
- Concurrent dispatch to all channels via `Promise.allSettled`
- 3-attempt retry with exponential backoff (0s, 2s, 8s)
- Failed deliveries logged to `alert_failures` table
- Dedup: `alert_sent_at` column set atomically with `status = 'down'`
- Recovery alerts fire when transitioning from `down` → `up`
- Throttle: max alerts per hour per monitor (configurable)

### Stale Down Monitor Handling
- On each tick, advance `next_expected_at` for `down` monitors to prevent accumulated miss alerts
- Walk forward using cron-parser until `next_expected_at` is in the future

### Self-Monitoring
- Self-ping pattern: scheduler pings an internal CronGuard monitor on each tick
- External backup: register `/api/health` with UptimeRobot free tier
- Railway health check URL configured to restart on failure

## 4. Dashboard Architecture

### TanStack Router
- Pathless `_auth.tsx` layout for auth guard (Clerk `isSignedIn` check in `beforeLoad`)
- Route loaders with `ensureQueryData` for instant page loads
- `defaultPreloadStaleTime: 0` required for TanStack Query integration
- File-based route tree with `@tanstack/router-plugin/vite` codegen

### TanStack Query Patterns
- Query key factory co-located with `queryOptions` (v5 canonical pattern)
- Polling: 60s for monitor list, 30s for monitor detail and ping history
- Optimistic updates for all CRUD operations with rollback on error
- Invalidation: broad `monitorKeys.lists()` on create/delete, targeted on update

### TanStack Form
- Shared Zod schemas in `@cronguard/shared/schemas/`
- `zodValidator()` adapter for form-level + field-level validation
- CronExpressionInput component with human-readable preview

### Component Architecture
- **Own:** StatusBadge, MonitorCard, MonitorDetail, PingTimeline, CronExpressionInput, AppSidebar
- **shadcn/ui (canary for v4):** Dialog, Select, DropdownMenu, Tooltip, Sheet
- **Toasts:** sonner (2KB, zero-config)

### Tailwind v4 Theme
- Dark-first with CSS custom properties via `@theme` directive
- oklch color space for perceptual uniformity
- System-preference light mode via `@media (prefers-color-scheme: light)`
- Semantic tokens: `--bg-base`, `--bg-elevated`, `--border-base`, `--text-base`, `--text-muted`, `--accent`

## Key Dependencies to Add

| Package | Purpose | Where |
|---|---|---|
| `nanoid` | Slug generation | api |
| `express-rate-limit` | Ping endpoint rate limiting | api |
| `lru-cache` | Monitor slug cache | api |
| `p-limit` | Alert dispatch concurrency | api |
| `date-fns` | Time formatting | web |
| `sonner` | Toast notifications | web |
| `@tanstack/router-plugin` | Route codegen | web (dev) |
| `@tanstack/zod-form-adapter` | Form validation | web |

## Decisions Recorded

D007-D013 captured in `.gsd/DECISIONS.md` covering scheduler architecture, state machine, ping response pattern, slug format, alert channel model, frontend routing, and Neon driver strategy.
