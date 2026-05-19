# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Unique ping URL per monitor that accepts GET/POST and records heartbeat timestamps
- Class: primary-user-loop
- Status: active
- Description: Unique ping URL per monitor that accepts GET/POST and records heartbeat timestamps
- Why it matters: Core product loop — developers add this URL to their cron jobs to report health
- Source: user
- Validation: unmapped

### R002 — Miss detection engine that compares expected vs actual pings and triggers alerts when a job fails to report
- Class: core-capability
- Status: active
- Description: Miss detection engine that compares expected vs actual pings and triggers alerts when a job fails to report
- Why it matters: The entire value proposition — alerting when cron jobs silently fail
- Source: user
- Validation: unmapped

### R003 — Multi-channel alerting: email (Resend), Slack webhooks, Discord webhooks
- Class: core-capability
- Status: active
- Description: Multi-channel alerting: email (Resend), Slack webhooks, Discord webhooks
- Why it matters: Developers need alerts where they already work — email for fallback, Slack/Discord for instant visibility
- Source: user
- Validation: unmapped

### R004 — Dashboard with CRUD for monitors, live status indicators, and ping history
- Class: primary-user-loop
- Status: active
- Description: Dashboard with CRUD for monitors, live status indicators, and ping history
- Why it matters: Users need to create/manage monitors and see at a glance which jobs are healthy
- Source: user
- Validation: unmapped

### R005 — Stripe billing with $9/mo Pro plan, free tier (5 monitors), and customer self-service portal
- Class: launchability
- Status: active
- Description: Stripe billing with $9/mo Pro plan, free tier (5 monitors), and customer self-service portal
- Why it matters: Must accept paying customers from day one to hit $1K MRR target
- Source: user
- Validation: unmapped

### R006 — Clerk authentication with protected API routes and tenant isolation
- Class: compliance/security
- Status: active
- Description: Clerk authentication with protected API routes and tenant isolation
- Why it matters: Multi-tenant SaaS requires proper auth boundaries — users must only see their own monitors
- Source: user
- Validation: unmapped

### R007 — SEO-optimized landing page with pricing, value prop, and Cronhub migration guide
- Class: launchability
- Status: active
- Description: SEO-optimized landing page with pricing, value prop, and Cronhub migration guide
- Why it matters: Primary acquisition channel — capture displaced Cronhub users searching for alternatives
- Source: user
- Validation: unmapped

### R008 — Cron expression parsing with human-readable schedule display and grace period configuration
- Class: quality-attribute
- Status: active
- Description: Cron expression parsing with human-readable schedule display and grace period configuration
- Why it matters: Core UX — users define schedules via cron expressions and need to understand what they mean
- Source: user
- Validation: unmapped

### R009 — Infrastructure cost must stay under $10/mo using free tiers (Neon, Clerk, Resend) and Railway ($5/mo)
- Class: constraint
- Status: active
- Description: Infrastructure cost must stay under $10/mo using free tiers (Neon, Clerk, Resend) and Railway ($5/mo)
- Why it matters: Solo founder with near-zero budget — must be profitable from first paying customer
- Source: user
- Validation: unmapped

### R010 — Free tier with 5 monitors and email alerts — more generous than most competitors
- Class: differentiator
- Status: active
- Description: Free tier with 5 monitors and email alerts — more generous than most competitors
- Why it matters: Competitors offer 1-3 free monitors. 5 free monitors lowers adoption friction and drives word-of-mouth
- Source: user
- Validation: unmapped

### R011 — Ping endpoint rate limit (max 1 accepted ping per minute per monitor)
- Class: constraint
- Status: active
- Description: The ping endpoint must deduplicate or reject pings beyond 1 per minute per monitor (return 429 or silently dedupe to a single row per minute window)
- Why it matters: Without this guard, a single power user pinging every second on 100 monitors generates ~4.3M rows/month/user (vs the ~865k expected at 1 ping/5min). Storage explodes, Neon costs blow past R009 ($10/mo infra cap), and unit economics collapse. Protects per-user storage budget at ~170 MB steady state.
- Source: assistant analysis (unit economics review 2026-05-19)
- Validation: unmapped

### R012 — Tier-based retention cleanup (daily cron, 7d free / 30d pro / 90d team)
- Class: constraint
- Status: active
- Description: A daily cron job must DELETE pings older than the user's plan retention window (7 days free, 30 days pro, 90 days team) and alerts older than 1 year. Cleanup must run idempotently and log row counts.
- Why it matters: Without cleanup, storage grows linearly forever, breaking R009 ($10/mo cap) within months. Tier-based retention is also an explicit upsell driver for R005 (Stripe billing) — users on free see truncated history and feel the upgrade pressure organically.
- Source: assistant analysis (unit economics review 2026-05-19)
- Validation: unmapped

## Validated

## Deferred

## Out of Scope

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | primary-user-loop | active | none | none | unmapped |
| R002 | core-capability | active | none | none | unmapped |
| R003 | core-capability | active | none | none | unmapped |
| R004 | primary-user-loop | active | none | none | unmapped |
| R005 | launchability | active | none | none | unmapped |
| R006 | compliance/security | active | none | none | unmapped |
| R007 | launchability | active | none | none | unmapped |
| R008 | quality-attribute | active | none | none | unmapped |
| R009 | constraint | active | none | none | unmapped |
| R010 | differentiator | active | none | none | unmapped |
| R011 | constraint | active | none | none | unmapped |
| R012 | constraint | active | none | none | unmapped |

## Coverage Summary

- Active requirements: 12
- Mapped to slices: 10
- Validated: 0
- Unmapped active requirements: 2 (R011, R012 — added 2026-05-19, not yet assigned to a slice)
