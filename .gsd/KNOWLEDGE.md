# Project Knowledge

Append-only register of project-specific rules, patterns, and lessons learned.
Agents read this before every unit. Add entries when you discover something worth remembering.

## Rules

| # | Scope | Rule | Why | Added |
|---|-------|------|-----|-------|
| K001 | db/pings | Bound the `pings` table at both ends: rate-limit writes (max 1 accepted ping/min/monitor) AND daily retention cleanup per plan tier. Any new feature that writes to `pings` must sit behind the rate-limit middleware; any change to retention windows must update the cleanup cron in lockstep. | `pings` is the storage hot path. Unbounded writes or unbounded retention break R009 ($10/mo infra cap) within weeks-to-months and collapse Pro unit economics. See D015 for the full math (170 MB/user steady state vs 860 MB worst case). | 2026-05-19 |

## Patterns

| # | Pattern | Where | Notes |
|---|---------|-------|-------|

## Lessons Learned

| # | What Happened | Root Cause | Fix | Scope |
|---|--------------|------------|-----|-------|
