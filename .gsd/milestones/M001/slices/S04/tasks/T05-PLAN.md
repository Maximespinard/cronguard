---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T05: Validate and close M001

Reconcile REQUIREMENTS.md against what shipped (mark validated/deferred). File M001 VALIDATION.md via gsd_validate_milestone with verdict=pass. Complete M001 via gsd_complete_milestone. Open PR for the feature branch.

## Inputs

- `S01-S04 summaries`
- `S04-UAT.md`
- `REQUIREMENTS.md current state`

## Expected Output

- `M001 closed`
- `Validation artifact filed`
- `PR opened to main`

## Verification

M001 status shows closed; VALIDATION.md verdict=pass; PR created with summary of all 4 slices and UAT evidence linked.
