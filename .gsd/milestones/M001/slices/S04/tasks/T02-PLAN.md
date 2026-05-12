---
estimated_steps: 1
estimated_files: 6
skills_used: []
---

# T02: Add Vitest + React Testing Library setup for apps/web

Install vitest, @testing-library/react, @testing-library/jest-dom, jsdom. Configure vitest.config.ts for apps/web. Add component tests for MonitorList (rendering states: empty, loading, populated), CreateMonitorDialog (form validation + submit), and AlertChannelList. Mock TanStack Query hooks or use MSW for fetch.

## Inputs

- `Existing components`
- `apps/api vitest config as reference`

## Expected Output

- `Vitest configured for web workspace`
- `Passing component test suite`

## Verification

`npm run test --workspace=apps/web` passes; coverage report shows ≥80% lines on tested components.
