# S02: Miss Detection Engine & Alert Dispatch — UAT

**Milestone:** M001
**Written:** 2026-05-12T08:43:36.842Z

## Manual verification (deferred to live env)

- [ ] Create monitor with 1m schedule + 30s grace
- [ ] Send ping → confirm up
- [ ] Stop pinging → confirm grace state at expected+0, down state at expected+grace
- [ ] Down transition triggers email via Resend
- [ ] Down transition triggers Slack/Discord webhook if configured
- [ ] Ping after down → recovery alert fires through same channels
- [ ] Second miss while still down does not double-alert (missKey idempotency)

Automated coverage: integration.test.ts exercises the full pipeline end-to-end.
