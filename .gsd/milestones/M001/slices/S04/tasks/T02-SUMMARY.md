---
id: T02
parent: S04
milestone: M001
key_files:
  - apps/web/vitest.config.ts
  - apps/web/src/test/setup.ts
  - apps/web/src/test/utils.tsx
  - apps/web/src/test/fixtures.ts
  - apps/web/src/components/monitors/monitor-list.test.tsx
  - apps/web/src/components/monitors/create-monitor-dialog.test.tsx
  - apps/web/src/components/alert-channels/alert-channel-list.test.tsx
  - apps/web/package.json
key_decisions:
  - Mocked hooks module-level (vi.mock) rather than introducing MSW — simpler, deterministic, and sufficient because the tested components only consume hook return values.
  - Stubbed @tanstack/react-router's Link to a plain <a> in MonitorList tests to avoid building a full router context for a single navigation primitive.
  - Polyfilled hasPointerCapture/releasePointerCapture/scrollIntoView/ResizeObserver in setup.ts so Radix Dialog renders correctly under jsdom.
  - Pinned vitest to ^3.1.4 to match apps/api and avoid @vitest/coverage-v8 peer-dep conflicts with the latest 4.x line.
duration: 
verification_result: passed
completed_at: 2026-05-12T10:15:09.196Z
blocker_discovered: false
---

# T02: Added Vitest + React Testing Library to apps/web with 10 component tests covering MonitorList, CreateMonitorDialog, and AlertChannelList.

**Added Vitest + React Testing Library to apps/web with 10 component tests covering MonitorList, CreateMonitorDialog, and AlertChannelList.**

## What Happened

Installed vitest@^3.1.4 (matching apps/api), jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, and @vitest/coverage-v8 as devDependencies of @cronguard/web. Created vitest.config.ts wired with the react plugin, the @cronguard/shared path alias from vite.config.ts, jsdom environment, and src/test/setup.ts for setup. The setup file imports jest-dom matchers, registers an afterEach cleanup, and polyfills the small set of browser APIs Radix UI Dialog/Popover require under jsdom (hasPointerCapture, releasePointerCapture, scrollIntoView, ResizeObserver). Added test/test:watch/test:coverage scripts to apps/web/package.json. Added src/test/utils.tsx with a TestProviders wrapper (QueryClientProvider + Suspense fallback, retries disabled) and renderWithProviders helper, plus src/test/fixtures.ts with makeMonitor / makeAlertChannel factories. Wrote three test suites: monitor-list.test.tsx (empty state, populated grid with names/schedules/ping URLs, timeAgo formatting incl. 'Never') — TanStack Router's Link is stubbed to a plain anchor via vi.mock since there's no router context in tests; create-monitor-dialog.test.tsx (dialog opens, submits typed values to the mutation with default gracePeriod=5 and timezone='UTC', surfaces ApiRequestError messages, disables submit while pending) using @testing-library/user-event; alert-channel-list.test.tsx (empty state, renders Active/Disabled badges per channel, delete-confirm flow calls the delete mutation with the right id). Hooks are mocked module-level via vi.mock so the suspense queries never hit the network. All 10 tests pass; coverage on the three target files is 94.1% lines overall (alert-channel-list 96.27%, monitor-list 94.5%, create-monitor-dialog 90.38%) — comfortably above the 80% bar. Per the coordination note with T01, I did not run git commands; new files are left unstaged.

## Verification

Ran `npm run test --workspace=apps/web` (3 files, 10 tests passing in ~1.9s), `npm run test:coverage --workspace=apps/web` (94.1% lines on tested files, all >= 90%), and `npx tsc -b apps/web` to confirm the test files type-check cleanly.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run test --workspace=apps/web` | 0 | 3 test files, 10 tests passed | 1890ms |
| 2 | `npm run test:coverage --workspace=apps/web` | 0 | All files 94.1% lines / 80.55% branch / 72.22% funcs — above 80% line target | 1470ms |
| 3 | `npx tsc -b apps/web` | 0 | clean typecheck after tightening test indexing | 4500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/vitest.config.ts`
- `apps/web/src/test/setup.ts`
- `apps/web/src/test/utils.tsx`
- `apps/web/src/test/fixtures.ts`
- `apps/web/src/components/monitors/monitor-list.test.tsx`
- `apps/web/src/components/monitors/create-monitor-dialog.test.tsx`
- `apps/web/src/components/alert-channels/alert-channel-list.test.tsx`
- `apps/web/package.json`
