---
estimated_steps: 1
estimated_files: 7
skills_used: []
---

# T01: Commit pending work and verify local stack

Stage and commit the sign-in page, router updates, db/client and drizzle.config changes, and other pending mods on feature/m001-s03-dashboard-ui. Boot API + web locally, sign in via Clerk, confirm dashboard loads and hits the API without errors.

## Inputs

- `Current uncommitted diff`
- `Clerk dev keys in .env.local`

## Expected Output

- `New commit on feature/m001-s03-dashboard-ui`
- `Clean working tree`
- `Verified running stack`

## Verification

git status clean after commit; `npm run dev` (api+web) boots without errors; browser session signs in and reaches dashboard with monitors list rendering.
