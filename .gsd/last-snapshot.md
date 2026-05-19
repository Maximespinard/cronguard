# GSD context snapshot (2026-05-12T10:24:35.800Z)

## Active context
Active: M001 / S04 / T03 - Add Playwright E2E golden-path spec

## Top project memories
- [MEM001] (architecture) Application architecture pattern Chose: Vite SPA + separate Express API (no Next.js). Rationale: Owner's expertise is React + Vite + TanStack ecosystem. Separate API enables independent scaling and Railway deployment. No SSR needed for dashboard app..
- [MEM002] (architecture) Monorepo structure Chose: apps/web, apps/api, packages/shared with npm workspaces. Rationale: Shared types and utilities between frontend and backend. Single repo simplifies CI and deployment. npm workspaces over Turborepo to keep tooling minimal..
- [MEM003] (architecture) Database provider Chose: Neon Postgres (free tier). Rationale: Generous free tier (0.5GB storage, 190 compute hours/mo), serverless Postgres with branching, familiar SQL. Keeps costs at $0 until significant scale..
- [MEM004] (architecture) Pricing tiers and structure Chose: Free (5 monitors, email), Pro $9/mo (50 monitors, Slack/Discord/webhooks, 30d retention), Team $29/mo (200 monitors, SMS/PagerDuty, 90d retention). Rationale: $9 sits below psychological $10 threshold, undercuts Healthchecks ($20) and Cronitor ($20+). Free tier at 5 monitors is more generous than competitors (1-3). 112 Pro customers = $1K MRR target..
- [MEM005] (architecture) Auth provider Chose: Clerk. Rationale: Free up to 10K MAU, drop-in React components, JWT verification for API routes, webhook events for user lifecycle. Owner has existing experience..
- [MEM006] (architecture) Email provider for alerts Chose: Resend. Rationale: Free tier (100 emails/day, 3K/mo), simple API, React Email for templates. Sufficient for MVP alert volume..
