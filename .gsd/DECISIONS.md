# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 |  | architecture | Application architecture pattern | Vite SPA + separate Express API (no Next.js) | Owner's expertise is React + Vite + TanStack ecosystem. Separate API enables independent scaling and Railway deployment. No SSR needed for dashboard app. | no | human |
| D002 |  | architecture | Monorepo structure | apps/web, apps/api, packages/shared with npm workspaces | Shared types and utilities between frontend and backend. Single repo simplifies CI and deployment. npm workspaces over Turborepo to keep tooling minimal. | Yes | collaborative |
| D003 |  | infrastructure | Database provider | Neon Postgres (free tier) | Generous free tier (0.5GB storage, 190 compute hours/mo), serverless Postgres with branching, familiar SQL. Keeps costs at $0 until significant scale. | Yes | human |
| D004 |  | pricing | Pricing tiers and structure | Free (5 monitors, email), Pro $9/mo (50 monitors, Slack/Discord/webhooks, 30d retention), Team $29/mo (200 monitors, SMS/PagerDuty, 90d retention) | $9 sits below psychological $10 threshold, undercuts Healthchecks ($20) and Cronitor ($20+). Free tier at 5 monitors is more generous than competitors (1-3). 112 Pro customers = $1K MRR target. | Yes | collaborative |
| D005 |  | library | Auth provider | Clerk | Free up to 10K MAU, drop-in React components, JWT verification for API routes, webhook events for user lifecycle. Owner has existing experience. | Yes | human |
| D006 |  | library | Email provider for alerts | Resend | Free tier (100 emails/day, 3K/mo), simple API, React Email for templates. Sufficient for MVP alert volume. | Yes | collaborative |
