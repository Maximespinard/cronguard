---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T02: Alert channel CRUD + monitor association

CRUD endpoints for /api/alert-channels (create/list/update/delete) and /api/monitors/:id/channels (associate/dissociate). Zod schemas for channel config. Plan-tier enforcement on channel types.

## Inputs

- `DB schema: alert_channels, monitor_alert_channels tables`
- `Existing auth middleware pattern from monitors.ts`

## Expected Output

- `alert-channels.ts router with CRUD + association endpoints`
- `Shared Zod schemas for channel config validation`
- `Channel types: email, slack, discord, webhook`

## Verification

tsc --noEmit && npx eslint . && npx vitest run
