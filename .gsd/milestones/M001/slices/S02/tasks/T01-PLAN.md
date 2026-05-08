---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Extract shared cron utilities

Extract computeNextExpected from monitors.ts and ping.ts into apps/api/src/lib/cron.ts. Single source of truth. Update both consumers to import from the new module.

## Inputs

- `monitors.ts:35-39 computeNextExpected`
- `ping.ts:77-80 computeNextExpected`

## Expected Output

- `apps/api/src/lib/cron.ts with computeNextExpected`
- `monitors.ts imports from lib/cron.ts`
- `ping.ts imports from lib/cron.ts`

## Verification

tsc --noEmit && npx eslint . && npx vitest run — zero errors, existing tests pass
