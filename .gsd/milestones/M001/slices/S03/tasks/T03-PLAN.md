---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T03: Monitor detail + edit/delete dialogs

Monitor detail page showing config, recent pings, and edit/delete dialogs wired to monitor mutation endpoints.

## Inputs

- `Monitor GET/PUT/DELETE endpoints`

## Expected Output

- `Functional detail page with mutations`

## Verification

tsc --noEmit clean, manual: detail/edit/delete works
