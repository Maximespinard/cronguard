# M001: Foundation & Core Engine

**Gathered:** 2026-05-12
**Status:** Ready for planning (retroactive — S01-S03 complete, S04 in flight)

## Project Description

CronGuard is a cron job monitoring SaaS: developers register a cron task, the
service issues a unique ping URL, the cron pings on each run, and CronGuard
alerts the developer when a ping is missed past its grace period. M001 builds
the end-to-end vertical: ping ingestion, miss detection, alert dispatch, and a
dashboard to manage monitors and channels.

## Why This Milestone

CronGuard has no value until a developer can wire a cron job to a URL, miss a
run, and get paged. M001 is the smallest scope that proves the core loop works
in production-like conditions — without it, every later slice (billing,
retention, integrations) is decoration on a non-product.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Sign up via Clerk, create a monitor in the dashboard, copy its ping URL, and
  curl it from a real cron job
- Watch the monitor transition `new → up → grace → down → up` in the dashboard
- Receive an email (and optionally Slack/Discord) alert within ~2 minutes of a
  missed ping, and a recovery alert when the job runs again

### Entry point / environment

- Entry point: web dashboard at the deployed web app URL; ping endpoint at
  `https://<api-host>/api/ping/:slug`
- Environment: Railway-deployed API + Neon Postgres + Vite SPA in browser;
  local dev via `npm run dev` against the same Neon branch
- Live dependencies involved: Clerk (auth), Neon (Postgres), Resend (email),
  user-supplied Slack/Discord webhooks

## Completion Class

- Contract complete means: API endpoints validate inputs against shared Zod
  schemas; unit tests cover scheduler state transitions, formatters, and
  dispatcher retry behavior
- Integration complete means: end-to-end flow (sign-in → create monitor → ping
  → miss → alert → recovery) works against a real Neon DB and a real Resend
  send, verified in the running stack
- Operational complete means: scheduler survives process restart (state lives
  in DB), stale `down` monitors do not produce alert storms, and the ping
  endpoint stays under ~200ms p95 with the cache warm

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A real curl from a host machine hits `/api/ping/:slug`, the dashboard reflects
  the heartbeat, and the monitor's status updates within one scheduler tick
- A monitor that stops pinging transitions to `grace` then `down`, an email
  alert is delivered via Resend, and a Slack/Discord webhook (if configured)
  fires once and only once (idempotency via `miss_key`)
- A recovery ping flips status back to `up` and emits a recovery alert
- Vitest + Playwright suites run green in CI; `git status` is clean on the
  milestone branch before close

## Architectural Decisions

See `.gsd/DECISIONS.md` for the full register. Key decisions for M001:

### Vite SPA + Express API (no Next.js)

**Decision:** Two-app monorepo, `apps/web` (Vite + TanStack) and `apps/api`
(Express on Node), shared types in `packages/shared`.

**Rationale:** Owner's strongest stack; independent scaling; Railway-friendly;
no SSR requirement for a dashboard.

### Neon Postgres + Drizzle ORM

**Decision:** Neon serverless Postgres (WebSocket pool for API, HTTP driver
optional for ping path); Drizzle for schema + queries.

**Rationale:** Free tier covers MVP; WebSocket pool keeps API latency at
20–60ms warm; ping path is fire-and-forget so driver choice is non-critical
there.

### Single setInterval miss-detection scheduler

**Decision:** 30s polling loop, DB-stored `next_expected_ping_at`, stateless
and restartable, `FOR UPDATE SKIP LOCKED` for safety.

**Rationale:** Simplest correct design; DB is the only source of truth; works
with a single Railway process to ~10K monitors; trivially horizontalizable
later.

### nanoid(21) ping slug as bearer token

**Decision:** 126-bit entropy slug in URL, no auth on ping endpoint.

**Rationale:** Curl ergonomics; brute-force infeasible; matches
Healthchecks.io's proven pattern.

### Alert channels are user-level, reusable, joined to monitors

**Decision:** `alert_channels` (user-scoped, JSONB `config`) + `monitor_alert_channels`
join table. `alerts.miss_key` unique index dedups dispatches.

**Rationale:** A user configures Slack once and assigns it to many monitors;
JSONB avoids per-type columns; `miss_key` makes retries safe.

### Clerk for auth, Resend for email

**Decision:** Clerk handles sign-up/in and JWT verification; Resend sends alert
email.

**Rationale:** Both have generous free tiers, drop-in SDKs, and owner has
prior experience.

## Error Handling Strategy

- API: thrown errors flow through a central Express error middleware that maps
  Zod validation errors to 400 and unknown errors to 500 with a stable error
  shape (`{ error: { code, message } }`).
- Scheduler dispatch: `Promise.allSettled` across channels; 3 retries with
  exponential backoff (0s, 2s, 8s); permanent failures logged to
  `alert_failures` so they don't block the tick.
- Idempotency: `alerts.miss_key` unique index + `INSERT ... ON CONFLICT DO
  NOTHING` so retried ticks never double-alert.
- Ping endpoint: respond first, write second; if the write buffer fails after
  retries, log and surface in metrics rather than blocking the response.

## Risks and Unknowns

- Neon cold-start latency on free-tier compute pauses — mitigated by warm
  WebSocket pool but could still bite on long idle periods
- Resend daily quota (100/day free) — fine for MVP but a noisy customer could
  burn it
- Clerk webhook lag for user lifecycle events — accepted; we treat the local
  `users` row as eventually consistent
- Scheduler clock drift if Railway process is throttled — 30s granularity gives
  headroom; monitored via `next_expected_at` skew

## Existing Codebase / Prior Art

- `apps/api/src/scheduler/` — miss detection, dispatcher, formatters (S02)
- `apps/api/src/routes/` — monitors, alert-channels, ping, webhooks (S01–S02)
- `apps/api/src/db/` — Drizzle schema and Neon client (S01)
- `apps/web/src/pages/` and `apps/web/src/components/` — dashboard UI (S03)
- `packages/shared/src/schemas/` — Zod schemas shared across apps

## Relevant Requirements

See `.gsd/REQUIREMENTS.md`. M001 advances every core-capability and
primary-user-loop requirement: monitor CRUD, ping ingestion, miss detection,
alert dispatch, dashboard visibility, and recovery signaling.

## Scope

### In Scope

- Monitor CRUD via API and dashboard
- Ping ingestion (GET/POST `/api/ping/:slug`) with metadata capture
- Miss detection scheduler with grace + down transitions
- Email alerts (Resend) + Slack/Discord webhook alerts
- Recovery alerts on `down → up`
- Clerk-authenticated dashboard with monitor list, detail, and channel CRUD
- Cron expression parsing + human-readable display
- Automated test coverage: Vitest (unit + component), Playwright (E2E)

### Out of Scope / Non-Goals

- Billing, plan enforcement, Stripe (later milestone)
- SMS / PagerDuty channels (Team tier, later)
- Retention pruner (deferred until storage pressure is real)
- Admin/support tooling
- Multi-tenant team accounts
- SSR or marketing site

## Technical Constraints

- Node 20+, TypeScript strict, ESM throughout
- Tailwind v4 syntax (see project CLAUDE.md)
- No `any` types; eslint + `tsc --noEmit` must pass before every commit
- Single Railway process for API + scheduler (no separate worker)
- Free-tier budgets: Neon 0.5GB / 190 compute hrs, Resend 100/day, Clerk 10K MAU

## Integration Points

- Clerk — auth middleware on API, `<ClerkProvider>` on web
- Neon Postgres — WebSocket pool from API
- Resend — outbound transactional email for alerts
- Slack / Discord — outbound webhook POST per user-configured channel
- Railway — deployment target for API; web deploys as static SPA

## Testing Requirements

- Unit: scheduler state machine, formatters, dispatcher retry/dedup (Vitest)
- Integration: route handlers against a Neon test branch (Vitest)
- Component: dashboard widgets with React Testing Library (S04)
- E2E: sign-in → create monitor → ping → miss → alert → recovery (Playwright,
  S04)
- CI: lint + typecheck + unit + integration on every PR

## Acceptance Criteria

Per-slice criteria are recorded in each slice's `S0X-PLAN.md`. Milestone-level:
all S01–S04 slices marked complete, final integrated acceptance scenarios above
pass against a deployed Railway + Neon environment, and CI is green on the
milestone branch.

## Open Questions

- Recovery-alert throttling rules under flapping monitors — current thinking:
  one recovery per `down → up` edge, no further suppression
- Whether to expose `paused` as a user-facing control in M001 or defer —
  current thinking: defer to a later milestone unless S04 UAT reveals a real
  need
