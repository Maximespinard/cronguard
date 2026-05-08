import { createMonitorSchema, PLAN_LIMITS, updateMonitorSchema } from '@cronguard/shared';
import { and, count, desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { nanoid } from 'nanoid';

import { db, monitors, pings, users } from '../db/index.js';
import { computeNextExpected } from '../lib/cron.js';
import { getUserId, requireAuth } from '../middleware/auth.js';

// ─── Router ────────────────────────────────────────────────────────

const monitorRouter = Router();

// All routes require auth
monitorRouter.use(requireAuth);

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Resolve the internal DB user from the Clerk ID.
 * Returns the user row or null if not synced yet.
 */
async function resolveUser(clerkId: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true, planTier: true },
  });
  return row ?? null;
}

// ─── POST /api/monitors — Create a monitor ─────────────────────────

monitorRouter.post('/', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);

  // Parse and validate input
  const parsed = createMonitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  // Resolve internal user
  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned — webhook sync pending' });
    return;
  }

  // Enforce plan-tier monitor limit
  const countResult = await db
    .select({ total: count() })
    .from(monitors)
    .where(eq(monitors.userId, user.id));

  const total = countResult[0]?.total ?? 0;
  const limit = PLAN_LIMITS[user.planTier].monitors;
  if (total >= limit) {
    res.status(403).json({
      error: `Monitor limit reached (${String(limit)} on ${user.planTier} plan)`,
      limit,
      current: total,
    });
    return;
  }

  // Validate cron expression fully via cron-parser
  let nextExpected: Date;
  try {
    nextExpected = computeNextExpected(parsed.data.schedule, parsed.data.timezone);
  } catch {
    res.status(400).json({ error: 'Invalid cron expression — could not compute next run' });
    return;
  }

  // Insert monitor
  const slug = nanoid();
  const rows = await db
    .insert(monitors)
    .values({
      userId: user.id,
      name: parsed.data.name,
      slug,
      schedule: parsed.data.schedule,
      timezone: parsed.data.timezone,
      gracePeriod: parsed.data.gracePeriod * 60, // minutes → seconds
      nextExpectedPingAt: nextExpected,
    })
    .returning();
  const monitor = rows[0];
  if (!monitor) {
    res.status(500).json({ error: 'Insert failed' });
    return;
  }

  console.log(`[monitors] Created: ${monitor.id} slug=${slug} user=${clerkId}`);

  res.status(201).json({ monitor });
});

// ─── GET /api/monitors — List user's monitors ──────────────────────

monitorRouter.get('/', async (_req: Request, res: Response) => {
  const clerkId = getUserId(res);

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  const result = await db.query.monitors.findMany({
    where: eq(monitors.userId, user.id),
    orderBy: [desc(monitors.createdAt)],
  });

  res.json({ monitors: result });
});

// ─── GET /api/monitors/:id — Monitor detail with recent pings ──────

monitorRouter.get('/:id', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const monitorId = req.params['id'] as string;

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)),
  });

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  // Last 20 pings
  const recentPings = await db.query.pings.findMany({
    where: eq(pings.monitorId, monitor.id),
    orderBy: [desc(pings.receivedAt)],
    limit: 20,
  });

  res.json({ monitor, pings: recentPings });
});

// ─── PUT /api/monitors/:id — Update a monitor ──────────────────────

monitorRouter.put('/:id', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const monitorId = req.params['id'] as string;

  const parsed = updateMonitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  // Empty update — nothing to do
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  // Verify ownership
  const existing = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)),
    columns: { id: true, schedule: true, timezone: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  // Build update payload
  const update: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) update['name'] = parsed.data.name;
  if (parsed.data.gracePeriod !== undefined) update['gracePeriod'] = parsed.data.gracePeriod * 60;
  if (parsed.data.timezone !== undefined) update['timezone'] = parsed.data.timezone;
  if (parsed.data.schedule !== undefined) update['schedule'] = parsed.data.schedule;

  // Recompute nextExpectedPingAt if schedule or timezone changed
  const newSchedule = parsed.data.schedule ?? existing.schedule;
  const newTimezone = parsed.data.timezone ?? existing.timezone;
  if (parsed.data.schedule !== undefined || parsed.data.timezone !== undefined) {
    try {
      update['nextExpectedPingAt'] = computeNextExpected(newSchedule, newTimezone);
    } catch {
      res.status(400).json({ error: 'Invalid cron expression — could not compute next run' });
      return;
    }
  }

  const updatedRows = await db
    .update(monitors)
    .set(update)
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)))
    .returning();
  const updated = updatedRows[0];
  if (!updated) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  console.log(`[monitors] Updated: ${updated.id} user=${clerkId}`);

  res.json({ monitor: updated });
});

// ─── DELETE /api/monitors/:id — Delete a monitor ────────────────────

monitorRouter.delete('/:id', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const monitorId = req.params['id'] as string;

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  const deleted = await db
    .delete(monitors)
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)))
    .returning({ id: monitors.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  const deletedRow = deleted[0];
  if (!deletedRow) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  console.log(`[monitors] Deleted: ${deletedRow.id} user=${clerkId}`);

  res.status(200).json({ deleted: true, id: deletedRow.id });
});

export { monitorRouter };
