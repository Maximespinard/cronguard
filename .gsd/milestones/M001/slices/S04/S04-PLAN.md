# S04: Live UAT, frontend tests, and milestone closure

**Goal:** Land pending uncommitted work, add automated frontend test coverage (Vitest component + Playwright E2E), run real end-to-end UAT against Neon + Resend, and close M001 with validation evidence.
**Demo:** Sign in, create a monitor, ping it via curl, watch it transition up → grace → down → up with email alerts; Vitest + Playwright suites pass in CI.

## Must-Haves

- All uncommitted changes (sign-in page, db/router/drizzle config) committed and pushed.\n- Vitest suite covers monitor list, create/edit dialogs, alert channel form (≥80% lines on touched components).\n- Playwright golden-path spec passes locally and in CI: sign in → create monitor → ping → up state → delete.\n- Live UAT documented in S04-UAT.md with screenshots/log excerpts proving ping ingestion, miss detection, alert email delivery, and recovery alert.\n- M001-SUMMARY.md and M001 VALIDATION.md filed; REQUIREMENTS.md reconciled.

## Proof Level

- This slice proves: production-equivalent

## Integration Closure

CI runs lint + tsc + Vitest (api & web) + Playwright on PR. Manual UAT against deployed staging or local stack with real Neon and Resend keys.

## Verification

- Add Playwright HTML report artifact to CI. UAT log captures scheduler tick logs and Resend message IDs as evidence trail.

## Tasks

- [x] **T01: Commit pending work and verify local stack** `est:30m`
  Stage and commit the sign-in page, router updates, db/client and drizzle.config changes, and other pending mods on feature/m001-s03-dashboard-ui. Boot API + web locally, sign in via Clerk, confirm dashboard loads and hits the API without errors.
  - Files: `apps/web/src/pages/sign-in.tsx`, `apps/web/src/router.tsx`, `apps/api/src/db/client.ts`, `apps/api/src/index.ts`, `apps/api/drizzle.config.ts`, `.gitignore`, `package-lock.json`
  - Verify: git status clean after commit; `npm run dev` (api+web) boots without errors; browser session signs in and reaches dashboard with monitors list rendering.

- [x] **T02: Add Vitest + React Testing Library setup for apps/web** `est:2h`
  Install vitest, @testing-library/react, @testing-library/jest-dom, jsdom. Configure vitest.config.ts for apps/web. Add component tests for MonitorList (rendering states: empty, loading, populated), CreateMonitorDialog (form validation + submit), and AlertChannelList. Mock TanStack Query hooks or use MSW for fetch.
  - Files: `apps/web/vitest.config.ts`, `apps/web/package.json`, `apps/web/src/test/setup.ts`, `apps/web/src/components/monitors/monitor-list.test.tsx`, `apps/web/src/components/monitors/create-monitor-dialog.test.tsx`, `apps/web/src/components/alert-channels/alert-channel-list.test.tsx`
  - Verify: `npm run test --workspace=apps/web` passes; coverage report shows ≥80% lines on tested components.

- [ ] **T03: Add Playwright E2E golden-path spec** `est:3h`
  Install @playwright/test, scaffold playwright.config.ts at repo root with webServer entries booting api + web. Write one spec: sign in (using Clerk test mode or seeded JWT), create a monitor, simulate a ping via fetch to the API, assert monitor row shows up state, delete the monitor.
  - Files: `playwright.config.ts`, `e2e/golden-path.spec.ts`, `e2e/fixtures/auth.ts`, `package.json`, `.github/workflows/ci.yml`
  - Verify: `npx playwright test` passes locally; CI job runs Playwright and uploads HTML report on failure.

- [ ] **T04: Live UAT against Neon + Resend** `est:1h`
  With real Neon DB and Resend API key in .env.local, exercise the full flow: create a monitor with a 1-minute expected interval, ping it, let it miss (wait grace period), confirm down email arrives in inbox, ping again, confirm recovery email. Capture scheduler tick logs and Resend message IDs. Write findings to S04-UAT.md.
  - Files: `.gsd/milestones/M001/slices/S04/S04-UAT.md`
  - Verify: S04-UAT.md exists with: timestamps, scheduler logs showing state transitions (up→grace→down→up), Resend message IDs for down + recovery emails, screenshots of inbox.

- [ ] **T05: Validate and close M001** `est:45m`
  Reconcile REQUIREMENTS.md against what shipped (mark validated/deferred). File M001 VALIDATION.md via gsd_validate_milestone with verdict=pass. Complete M001 via gsd_complete_milestone. Open PR for the feature branch.
  - Files: `.gsd/REQUIREMENTS.md`, `.gsd/milestones/M001/M001-VALIDATION.md`, `.gsd/milestones/M001/M001-SUMMARY.md`
  - Verify: M001 status shows closed; VALIDATION.md verdict=pass; PR created with summary of all 4 slices and UAT evidence linked.

## Files Likely Touched

- apps/web/src/pages/sign-in.tsx
- apps/web/src/router.tsx
- apps/api/src/db/client.ts
- apps/api/src/index.ts
- apps/api/drizzle.config.ts
- .gitignore
- package-lock.json
- apps/web/vitest.config.ts
- apps/web/package.json
- apps/web/src/test/setup.ts
- apps/web/src/components/monitors/monitor-list.test.tsx
- apps/web/src/components/monitors/create-monitor-dialog.test.tsx
- apps/web/src/components/alert-channels/alert-channel-list.test.tsx
- playwright.config.ts
- e2e/golden-path.spec.ts
- e2e/fixtures/auth.ts
- package.json
- .github/workflows/ci.yml
- .gsd/milestones/M001/slices/S04/S04-UAT.md
- .gsd/REQUIREMENTS.md
- .gsd/milestones/M001/M001-VALIDATION.md
- .gsd/milestones/M001/M001-SUMMARY.md
