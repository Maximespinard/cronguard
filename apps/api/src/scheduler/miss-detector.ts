import { eq, sql } from 'drizzle-orm';

import { db, monitors } from '../db/index.js';
import { computeNextExpected } from '../lib/cron.js';

import { dispatchPendingAlerts } from './dispatcher.js';

// ─── Constants ──────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000;

// ─── Types ──────────────────────────────────────────────────────────

interface OverdueRow {
  id: string;
  schedule: string;
  timezone: string;
  status: 'up' | 'grace';
  gracePeriod: number;
  nextExpectedPingAt: string;
}

interface StaleDownRow {
  id: string;
  schedule: string;
  timezone: string;
  nextExpectedPingAt: string;
}

// ─── State ──────────────────────────────────────────────────────────

let intervalHandle: ReturnType<typeof setInterval> | null = null;

// ─── Core Logic ─────────────────────────────────────────────────────

/**
 * Process overdue monitors: up→grace and grace→down transitions.
 * Uses FOR UPDATE SKIP LOCKED for safe concurrent access.
 */
export async function processOverdueMonitors(now: Date = new Date()): Promise<number> {
  let transitioned = 0;

  await db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      SELECT id, schedule, timezone, status,
             grace_period AS "gracePeriod",
             next_expected_ping_at AS "nextExpectedPingAt"
      FROM monitors
      WHERE status IN ('up', 'grace')
        AND next_expected_ping_at IS NOT NULL
        AND next_expected_ping_at < ${now}
      FOR UPDATE SKIP LOCKED
    `);

    for (const row of result.rows as unknown as OverdueRow[]) {
      const expectedAt = new Date(row.nextExpectedPingAt);
      const graceDeadline = new Date(expectedAt.getTime() + row.gracePeriod * 1000);

      if (now >= graceDeadline) {
        // Grace period expired → transition to down, create pending alert
        const missKey = `${row.id}:${expectedAt.toISOString()}`;

        await tx
          .update(monitors)
          .set({ status: 'down', alertSentAt: now })
          .where(eq(monitors.id, row.id));

        // Idempotent alert insert — ON CONFLICT DO NOTHING prevents duplicates
        await tx.execute(sql`
          INSERT INTO alerts (monitor_id, type, status, miss_key, message, created_at)
          VALUES (
            ${row.id},
            'miss',
            'pending',
            ${missKey},
            ${`Monitor missed expected ping at ${expectedAt.toISOString()}`},
            ${now}
          )
          ON CONFLICT (monitor_id, miss_key) DO NOTHING
        `);

        transitioned++;
        console.log(
          `[miss-detector] ${row.status}→down: monitor=${row.id} expected=${expectedAt.toISOString()} grace=${String(row.gracePeriod)}s`,
        );
      } else if (row.status === 'up') {
        // Within grace period → silent transition to grace
        await tx.update(monitors).set({ status: 'grace' }).where(eq(monitors.id, row.id));

        transitioned++;
        console.log(
          `[miss-detector] up→grace: monitor=${row.id} expected=${expectedAt.toISOString()} grace_deadline=${graceDeadline.toISOString()}`,
        );
      }
      // status=grace but still within grace window → wait for next tick
    }
  });

  return transitioned;
}

/**
 * Advance nextExpectedPingAt for monitors stuck in 'down' state.
 * Prevents alert storms on scheduler restart by keeping the window current.
 */
export async function advanceStaleDownMonitors(now: Date = new Date()): Promise<number> {
  let advanced = 0;

  await db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      SELECT id, schedule, timezone,
             next_expected_ping_at AS "nextExpectedPingAt"
      FROM monitors
      WHERE status = 'down'
        AND next_expected_ping_at IS NOT NULL
        AND next_expected_ping_at < ${now}
      FOR UPDATE SKIP LOCKED
    `);

    for (const row of result.rows as unknown as StaleDownRow[]) {
      try {
        const nextExpected = computeNextExpected(row.schedule, row.timezone);

        await tx
          .update(monitors)
          .set({ nextExpectedPingAt: nextExpected })
          .where(eq(monitors.id, row.id));

        advanced++;
        console.log(
          `[miss-detector] advance-stale: monitor=${row.id} next=${nextExpected.toISOString()}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `[miss-detector] Failed to advance stale monitor: monitor=${row.id} error=${message}`,
        );
      }
    }
  });

  return advanced;
}

/**
 * Single poll cycle: detect misses, then advance stale monitors.
 */
async function poll(): Promise<void> {
  try {
    const transitioned = await processOverdueMonitors();
    const advanced = await advanceStaleDownMonitors();

    // Dispatch any pending alerts (created by transitions above or prior cycles)
    const dispatched = await dispatchPendingAlerts();

    if (transitioned > 0 || advanced > 0 || dispatched > 0) {
      console.log(
        `[miss-detector] Poll complete: transitioned=${String(transitioned)} advanced=${String(advanced)} dispatched=${String(dispatched)}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[miss-detector] Poll cycle failed: ${message}`);
  }
}

// ─── Lifecycle ──────────────────────────────────────────────────────

/**
 * Start the miss detection scheduler.
 * Runs immediately, then every 30 seconds.
 */
export function startMissDetector(): void {
  if (intervalHandle) {
    console.warn('[miss-detector] Already running — skipping start');
    return;
  }

  console.log(`[miss-detector] Starting with ${String(POLL_INTERVAL_MS / 1000)}s interval`);

  // Initial poll on startup
  void poll();

  intervalHandle = setInterval(() => {
    void poll();
  }, POLL_INTERVAL_MS);
}

/**
 * Stop the miss detection scheduler.
 */
export function stopMissDetector(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[miss-detector] Stopped');
  }
}
