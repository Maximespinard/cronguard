import { pingBodySchema } from '@cronguard/shared';
import { CronExpressionParser } from 'cron-parser';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';

import { db, monitors, pings } from '../db/index.js';

// ─── Types ────────────────────────────────────────────────────────

interface CachedMonitor {
  id: string;
  schedule: string;
  timezone: string;
  status: string;
  isPaused: boolean;
}

// ─── LRU Cache ────────────────────────────────────────────────────

const slugCache = new LRUCache<string, CachedMonitor>({
  max: 1000,
  ttl: 60_000, // 60s
});

// ─── Rate Limiters ────────────────────────────────────────────────

/** 120 pings/min per IP */
const ipLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many pings from this IP' },
});

/** 10 pings/min per monitor slug */
const slugLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req: Request) => req.params['slug'] as string,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many pings for this monitor' },
});

// ─── Router ────────────────────────────────────────────────────────

const pingRouter = Router();

// ─── Helpers ───────────────────────────────────────────────────────

async function lookupMonitor(slug: string): Promise<CachedMonitor | null> {
  const cached = slugCache.get(slug);
  if (cached) return cached;

  const row = await db.query.monitors.findFirst({
    where: eq(monitors.slug, slug),
    columns: { id: true, schedule: true, timezone: true, status: true, isPaused: true },
  });

  if (!row) return null;

  const entry: CachedMonitor = {
    id: row.id,
    schedule: row.schedule,
    timezone: row.timezone,
    status: row.status,
    isPaused: row.isPaused,
  };
  slugCache.set(slug, entry);
  return entry;
}

function computeNextExpected(schedule: string, timezone: string): Date {
  const interval = CronExpressionParser.parse(schedule, { tz: timezone });
  return interval.next().toDate();
}

// ─── GET/POST /api/ping/:slug ──────────────────────────────────────

async function handlePing(req: Request, res: Response): Promise<void> {
  const slug = req.params['slug'] as string;
  const cacheHit = slugCache.has(slug);
  const sourceIp =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? null;

  // Lookup monitor (LRU-cached)
  const monitor = await lookupMonitor(slug);

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  if (monitor.isPaused) {
    res.json({ ok: true, status: 'paused' });
    return;
  }

  // Parse ping payload — POST uses JSON body, GET uses query params
  let kind: 'success' | 'start' | 'fail' = 'success';
  let metadata: Record<string, unknown> | undefined;
  let duration: number | undefined;

  if (req.method === 'POST' && req.body) {
    const parsed = pingBodySchema.safeParse(req.body);
    if (parsed.success) {
      kind = parsed.data.kind;
      if (parsed.data.metadata) {
        duration = parsed.data.metadata.duration;
        metadata = { ...parsed.data.metadata };
      }
    }
  } else {
    const kindParam = req.query['kind'];
    if (typeof kindParam === 'string' && ['success', 'start', 'fail'].includes(kindParam)) {
      kind = kindParam as 'success' | 'start' | 'fail';
    }
  }

  // ── Respond immediately — before any DB write ──
  res.json({ ok: true });

  // ── Fire-and-forget: persist ping + update monitor state ──
  setImmediate(() => {
    void (async () => {
      try {
        // Insert ping record
        await db.insert(pings).values({
          monitorId: monitor.id,
          kind,
          sourceIp,
          duration: duration ?? null,
          metadata: metadata ?? null,
        });

        // Compute state transition: new|down|grace → up, up stays up
        const newStatus =
          monitor.status === 'new' || monitor.status === 'down' || monitor.status === 'grace'
            ? 'up'
            : monitor.status;

        // Compute next expected ping time
        let nextExpected: Date | undefined;
        try {
          nextExpected = computeNextExpected(monitor.schedule, monitor.timezone);
        } catch {
          // cron parse failure — skip nextExpectedPingAt update
        }

        const now = new Date();
        const updatePayload: Record<string, unknown> = {
          lastPingAt: now,
          status: newStatus,
        };

        // Clear alertSentAt on recovery so the next miss can fire a new alert
        if (newStatus === 'up' && monitor.status !== 'up') {
          updatePayload['alertSentAt'] = null;
        }

        if (nextExpected) {
          updatePayload['nextExpectedPingAt'] = nextExpected;
        }

        await db.update(monitors).set(updatePayload).where(eq(monitors.id, monitor.id));

        // Refresh cache with new status
        slugCache.set(slug, { ...monitor, status: newStatus });

        console.log(
          `[ping] Received: slug=${slug} kind=${kind} source_ip=${sourceIp ?? 'unknown'} cache_hit=${String(cacheHit)} status=${monitor.status}→${newStatus}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ping] DB write failed: slug=${slug} error=${message}`);
      }
    })();
  });
}

pingRouter.get('/:slug', ipLimiter, slugLimiter, handlePing);
pingRouter.post('/:slug', ipLimiter, slugLimiter, handlePing);

export { pingRouter };
