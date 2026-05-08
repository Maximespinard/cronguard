---
estimated_steps: 1
estimated_files: 5
skills_used: []
---

# T04: Alert dispatch (Resend, Slack, Discord, webhook)

Resend SDK for email alerts. HTTP POST for Slack/Discord/generic webhooks. Promise.allSettled for concurrent dispatch. 3-attempt retry with exponential backoff. Idempotent via missKey unique constraint. Alert templates for miss and recovery.

## Inputs

- `alert_channels table with JSONB config`
- `alerts table with missKey unique constraint`
- `Resend API for email`

## Expected Output

- `dispatcher.ts orchestrating multi-channel alert delivery`
- `Channel-specific formatters (email, slack, discord, webhook)`
- `Idempotent alert creation via missKey`
- `Retry logic with exponential backoff`

## Verification

tsc --noEmit && npx eslint . && unit tests for dispatch logic
