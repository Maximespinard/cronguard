---
estimated_steps: 1
estimated_files: 5
skills_used: []
---

# T03: Add Playwright E2E golden-path spec

Install @playwright/test, scaffold playwright.config.ts at repo root with webServer entries booting api + web. Write one spec: sign in (using Clerk test mode or seeded JWT), create a monitor, simulate a ping via fetch to the API, assert monitor row shows up state, delete the monitor.

## Inputs

- `Clerk testing docs`
- `Running api/web from T01`

## Expected Output

- `Playwright installed and configured`
- `One passing E2E spec`
- `CI workflow updated`

## Verification

`npx playwright test` passes locally; CI job runs Playwright and uploads HTML report on failure.
