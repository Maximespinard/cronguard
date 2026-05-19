# S02: Miss Detection Engine & Alert Dispatch

**Goal:** Miss detection engine that transitions monitors through grace→down states, dispatches alerts via email (Resend) and webhooks (Slack/Discord/generic), and sends recovery notifications when monitors come back up.
**Demo:** After this: a monitor that hasn't pinged within its schedule + grace period triggers an email alert via Resend and optionally Slack/Discord webhooks.

## Must-Haves

- Monitor missing its schedule transitions through grace→down. Email alert fires on down. Slack/Discord/webhook alerts fire on down. Recovery alert fires when monitor pings after being down. All alerts are idempotent via missKey. computeNextExpected extracted to shared utility.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Extract shared cron utilities** `est:15m`
  Extract computeNextExpected from monitors.ts and ping.ts into apps/api/src/lib/cron.ts. Single source of truth. Update both consumers to import from the new module.
  - Files: `apps/api/src/lib/cron.ts`, `apps/api/src/routes/monitors.ts`, `apps/api/src/routes/ping.ts`
  - Verify: tsc --noEmit && npx eslint . && npx vitest run — zero errors, existing tests pass

- [x] **T02: Alert channel CRUD + monitor association** `est:35m`
  CRUD endpoints for /api/alert-channels (create/list/update/delete) and /api/monitors/:id/channels (associate/dissociate). Zod schemas for channel config. Plan-tier enforcement on channel types.
  - Files: `apps/api/src/routes/alert-channels.ts`, `packages/shared/src/schemas/alert-channel.ts`, `packages/shared/src/types/alert.ts`, `apps/api/src/index.ts`
  - Verify: tsc --noEmit && npx eslint . && npx vitest run

- [x] **T03: Miss detection scheduler** `est:45m`
  setInterval polling at 30s. Queries monitors past nextExpectedPingAt + gracePeriod. State transitions: up→grace (past expected), grace→down (past grace). FOR UPDATE SKIP LOCKED. Advances nextExpectedPingAt for stale down monitors.
  - Files: `apps/api/src/scheduler/miss-detector.ts`, `apps/api/src/index.ts`
  - Verify: tsc --noEmit && npx eslint . && unit tests for state transition logic

- [x] **T04: Alert dispatch (Resend, Slack, Discord, webhook)** `est:45m`
  Resend SDK for email alerts. HTTP POST for Slack/Discord/generic webhooks. Promise.allSettled for concurrent dispatch. 3-attempt retry with exponential backoff. Idempotent via missKey unique constraint. Alert templates for miss and recovery.
  - Files: `apps/api/src/alerts/dispatcher.ts`, `apps/api/src/alerts/channels/email.ts`, `apps/api/src/alerts/channels/slack.ts`, `apps/api/src/alerts/channels/discord.ts`, `apps/api/src/alerts/channels/webhook.ts`
  - Verify: tsc --noEmit && npx eslint . && unit tests for dispatch logic

- [x] **T05: Recovery alerts + integration tests** `est:30m`
  Wire recovery alerts into ping handler (down→up transition dispatches through configured channels). Integration tests covering miss detection → alert creation → dispatch. Structured logging for scheduler observability.
  - Files: `apps/api/src/routes/ping.ts`, `apps/api/src/scheduler/miss-detector.ts`, `apps/api/src/alerts/dispatcher.ts`
  - Verify: tsc --noEmit && npx eslint . && full test suite passes

## Files Likely Touched

- apps/api/src/lib/cron.ts
- apps/api/src/routes/monitors.ts
- apps/api/src/routes/ping.ts
- apps/api/src/routes/alert-channels.ts
- packages/shared/src/schemas/alert-channel.ts
- packages/shared/src/types/alert.ts
- apps/api/src/index.ts
- apps/api/src/scheduler/miss-detector.ts
- apps/api/src/alerts/dispatcher.ts
- apps/api/src/alerts/channels/email.ts
- apps/api/src/alerts/channels/slack.ts
- apps/api/src/alerts/channels/discord.ts
- apps/api/src/alerts/channels/webhook.ts
