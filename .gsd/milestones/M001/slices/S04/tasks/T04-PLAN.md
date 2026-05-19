---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T04: Live UAT against Neon + Resend

With real Neon DB and Resend API key in .env.local, exercise the full flow: create a monitor with a 1-minute expected interval, ping it, let it miss (wait grace period), confirm down email arrives in inbox, ping again, confirm recovery email. Capture scheduler tick logs and Resend message IDs. Write findings to S04-UAT.md.

## Inputs

- `Neon dev DB URL`
- `Resend API key`
- `Running stack`

## Expected Output

- `S04-UAT.md with full evidence trail`

## Verification

S04-UAT.md exists with: timestamps, scheduler logs showing state transitions (up→grace→down→up), Resend message IDs for down + recovery emails, screenshots of inbox.
