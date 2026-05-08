---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: Miss detection scheduler

setInterval polling at 30s. Queries monitors past nextExpectedPingAt + gracePeriod. State transitions: up→grace (past expected), grace→down (past grace). FOR UPDATE SKIP LOCKED. Advances nextExpectedPingAt for stale down monitors.

## Inputs

- `monitors_miss_detection_idx index`
- `Monitor state machine: new→up→grace→down→up`
- `D decision: 30s polling, DB-stored next_expected_at`

## Expected Output

- `miss-detector.ts with startMissDetector()`
- `State transition: up→grace, grace→down`
- `FOR UPDATE SKIP LOCKED query`
- `Structured logging for each transition`

## Verification

tsc --noEmit && npx eslint . && unit tests for state transition logic
