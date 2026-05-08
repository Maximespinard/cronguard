# S01: DB Schema, Ping Endpoint & Auth — UAT

**Milestone:** M001
**Written:** 2026-05-08T13:16:37.076Z

## UAT: S01 — DB Schema, Ping Endpoint & Auth

### Prerequisites
- Neon database provisioned with DATABASE_URL set
- Clerk application configured with CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY
- `npm install` completed at root

### Test Cases

#### 1. Health Check
```bash
curl http://localhost:3000/health
# Expected: { "status": "ok" }
```

#### 2. Create Monitor (Authenticated)
```bash
curl -X POST http://localhost:3000/api/monitors \
  -H "Authorization: Bearer <clerk_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nightly Backup", "schedule": "0 2 * * *", "gracePeriodMinutes": 10}'
# Expected: 201 with monitor object including slug (nanoid 21)
```

#### 3. List Monitors (Tenant Isolated)
```bash
curl http://localhost:3000/api/monitors \
  -H "Authorization: Bearer <clerk_jwt>"
# Expected: 200 with array of only the authenticated user's monitors
```

#### 4. Ping a Monitor (No Auth)
```bash
curl http://localhost:3000/api/ping/<slug>
# Expected: { "ok": true } with <200ms response
```

#### 5. Rate Limiting
```bash
# Send 11 requests to same slug within 1 minute
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ping/<slug>; done
# Expected: 10th returns 200, 11th returns 429
```

#### 6. Plan-Tier Enforcement
```bash
# On free tier, try creating 6th monitor
# Expected: 403 with error about monitor limit
```

#### 7. Unauthorized Access
```bash
curl http://localhost:3000/api/monitors
# Expected: 401 Unauthorized
```
