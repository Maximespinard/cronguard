# Project

## What This Is

CronGuard is a dead man's switch / heartbeat monitoring SaaS for developers. It monitors cron jobs, scheduled tasks, and background processes by accepting HTTP pings and alerting when expected pings are missed. Built as a Vite SPA + separate Express API, targeting the gap left by Cronhub.io's shutdown (June 30, 2026).

## Core Value

A developer creates a monitor, gets a unique ping URL, adds it to their cron job, and gets alerted (email/Slack/Discord) within minutes when a job fails to ping on schedule.

## Project Shape

- **Complexity:** complex
- **Why:** Multi-service SaaS with auth, billing, real-time monitoring engine, alerting integrations, and marketing site — production-grade from day one.

## Current State

Empty repository. Research phase complete — competitor analysis, pricing strategy, tech stack, and MVP scope defined. No code written yet.

## Architecture / Key Patterns

- **Frontend:** React + Vite + TanStack (Query v5, Router, Form) + Tailwind CSS v4
- **Backend:** Node.js + Express API
- **Database:** Neon Postgres (free tier)
- **Auth:** Clerk
- **Payments:** Stripe ($9/mo Pro, $29/mo Team)
- **Alerts:** Resend (email), Slack webhooks, Discord webhooks
- **Hosting:** Railway (~$5/mo)
- **Monorepo:** apps/web, apps/api, packages/shared
- **CI:** GitHub Actions (lint + typecheck + test on PR)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Foundation & Core Engine — Monitoring engine, ping endpoint, miss detection, alerts, dashboard
- [ ] M002: Billing & Onboarding — Stripe integration, tier enforcement, onboarding flow
- [ ] M003: Landing Page & Launch — Marketing site, SEO, migration guide, production deploy
