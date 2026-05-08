# M001: Foundation & Core Engine

**Vision:** Build the complete monitoring engine — from ping ingestion to miss detection to alerting — with a functional dashboard. After M001, a developer can create a monitor, ping it from a cron job, and get alerted when the job fails.

## Success Criteria

- Developer can sign up via Clerk and access a protected dashboard
- Developer can create a monitor and receive a unique ping URL
- Pinging the URL records the heartbeat with timestamp and metadata
- Miss detection engine correctly identifies overdue monitors based on cron schedule + grace period
- Email alert fires within 2 minutes of a missed ping
- Slack and Discord webhook alerts can be configured and fire correctly
- Dashboard shows real-time monitor status (up/down/new) and ping history
- Cron expressions are parsed and displayed in human-readable format

## Slices

- [ ] **S01: DB Schema, Ping Endpoint & Auth** `risk:high` `depends:[]`
  > After this: After this: developer signs up via Clerk, creates a monitor via API, and pings its unique URL. Ping is recorded in Neon Postgres and visible via API query.

- [ ] **S02: Miss Detection Engine & Alert Dispatch** `risk:high` `depends:[S01]`
  > After this: After this: a monitor that hasn't pinged within its schedule + grace period triggers an email alert via Resend and optionally Slack/Discord webhooks.

- [ ] **S03: Dashboard UI** `risk:medium` `depends:[S01,S02]`
  > After this: After this: developer can sign in, see all monitors with live status indicators, create/edit/delete monitors, view ping history timeline, and configure alert channels — all in a polished Tailwind UI.

## Boundary Map

### S01 → S02\n\nProduces:\n- Drizzle schema and query helpers for monitors, pings, alerts\n- Monitor CRUD API endpoints (GET/POST/PUT/DELETE /api/monitors)\n- Ping ingestion endpoint (POST/GET /api/ping/:slug)\n- Clerk auth middleware attached to request context\n- Monitor model with schedule, gracePeriod, timezone, status fields\n\nConsumes:\n- nothing (first slice)\n\n### S01 → S03\n\nProduces:\n- All API endpoints that the dashboard will consume\n- Clerk auth session for frontend integration\n- Shared types from @cronguard/shared\n\n### S02 → S03\n\nProduces:\n- Alert configuration endpoints (CRUD alert channels per monitor)\n- Monitor status computation (up/down/new based on miss detection)\n- Alert history endpoint for dashboard display
