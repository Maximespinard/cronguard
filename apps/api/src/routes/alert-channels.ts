import {
  associateChannelsSchema,
  CHANNEL_CONFIG_SCHEMAS,
  createAlertChannelSchema,
  PLAN_LIMITS,
  TIER_ALLOWED_CHANNELS,
  updateAlertChannelSchema,
} from '@cronguard/shared';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { Router } from 'express';

import { alertChannels, db, monitorAlertChannels, monitors, users } from '../db/index.js';
import { getUserId, requireAuth } from '../middleware/auth.js';

// ─── Router ────────────────────────────────────────────────────────

const alertChannelRouter = Router();

alertChannelRouter.use(requireAuth);

// ─── Helpers ───────────────────────────────────────────────────────

async function resolveUser(clerkId: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true, planTier: true },
  });
  return row ?? null;
}

// ─── POST /api/alert-channels — Create a channel ──────────────────

alertChannelRouter.post('/', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);

  const parsed = createAlertChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned — webhook sync pending' });
    return;
  }

  // Enforce plan-tier channel type restriction
  const allowed = TIER_ALLOWED_CHANNELS[user.planTier];
  if (!allowed?.includes(parsed.data.type)) {
    res.status(403).json({
      error: `Channel type "${parsed.data.type}" is not available on the ${user.planTier} plan`,
      allowedTypes: allowed,
    });
    return;
  }

  // Enforce plan-tier channel count limit
  const countResult = await db
    .select({ total: count() })
    .from(alertChannels)
    .where(eq(alertChannels.userId, user.id));

  const total = countResult[0]?.total ?? 0;
  const limit = PLAN_LIMITS[user.planTier].alertChannels;
  if (total >= limit) {
    res.status(403).json({
      error: `Alert channel limit reached (${String(limit)} on ${user.planTier} plan)`,
      limit,
      current: total,
    });
    return;
  }

  // Validate config against specific channel type schema
  const configSchema = CHANNEL_CONFIG_SCHEMAS[parsed.data.type];
  const configParsed = configSchema.safeParse(parsed.data.config);
  if (!configParsed.success) {
    res.status(400).json({
      error: 'Invalid config for channel type',
      issues: configParsed.error.flatten().fieldErrors,
    });
    return;
  }

  const rows = await db
    .insert(alertChannels)
    .values({
      userId: user.id,
      type: parsed.data.type,
      name: parsed.data.name,
      config: configParsed.data,
    })
    .returning();
  const channel = rows[0];
  if (!channel) {
    res.status(500).json({ error: 'Insert failed' });
    return;
  }

  console.log(`[alert-channels] Created: ${channel.id} type=${parsed.data.type} user=${clerkId}`);

  res.status(201).json({ channel });
});

// ─── GET /api/alert-channels — List user's channels ────────────────

alertChannelRouter.get('/', async (_req: Request, res: Response) => {
  const clerkId = getUserId(res);

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  const result = await db.query.alertChannels.findMany({
    where: eq(alertChannels.userId, user.id),
  });

  res.json({ channels: result });
});

// ─── PUT /api/alert-channels/:id — Update a channel ────────────────

alertChannelRouter.put('/:id', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const channelId = req.params['id'] as string;

  const parsed = updateAlertChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  // Verify ownership
  const existing = await db.query.alertChannels.findFirst({
    where: and(eq(alertChannels.id, channelId), eq(alertChannels.userId, user.id)),
    columns: { id: true, type: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Alert channel not found' });
    return;
  }

  // If config is being updated, validate against the channel type
  if (parsed.data.config !== undefined) {
    const configSchema = CHANNEL_CONFIG_SCHEMAS[existing.type];
    const configParsed = configSchema.safeParse(parsed.data.config);
    if (!configParsed.success) {
      res.status(400).json({
        error: 'Invalid config for channel type',
        issues: configParsed.error.flatten().fieldErrors,
      });
      return;
    }
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update['name'] = parsed.data.name;
  if (parsed.data.config !== undefined) update['config'] = parsed.data.config;
  if (parsed.data.isEnabled !== undefined) update['isEnabled'] = parsed.data.isEnabled;

  const updatedRows = await db
    .update(alertChannels)
    .set(update)
    .where(and(eq(alertChannels.id, channelId), eq(alertChannels.userId, user.id)))
    .returning();
  const updated = updatedRows[0];
  if (!updated) {
    res.status(404).json({ error: 'Alert channel not found' });
    return;
  }

  console.log(`[alert-channels] Updated: ${updated.id} user=${clerkId}`);

  res.json({ channel: updated });
});

// ─── DELETE /api/alert-channels/:id — Delete a channel ──────────────

alertChannelRouter.delete('/:id', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const channelId = req.params['id'] as string;

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  const deleted = await db
    .delete(alertChannels)
    .where(and(eq(alertChannels.id, channelId), eq(alertChannels.userId, user.id)))
    .returning({ id: alertChannels.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: 'Alert channel not found' });
    return;
  }

  const deletedRow = deleted[0];
  if (!deletedRow) {
    res.status(404).json({ error: 'Alert channel not found' });
    return;
  }

  console.log(`[alert-channels] Deleted: ${deletedRow.id} user=${clerkId}`);

  res.status(200).json({ deleted: true, id: deletedRow.id });
});

// ═══════════════════════════════════════════════════════════════════
// Monitor ↔ Channel association endpoints
// Mounted under /api/monitors/:monitorId/channels
// ═══════════════════════════════════════════════════════════════════

const monitorChannelRouter = Router({ mergeParams: true });

monitorChannelRouter.use(requireAuth);

// ─── GET /api/monitors/:monitorId/channels — List linked channels ──

monitorChannelRouter.get('/', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const monitorId = req.params['monitorId'] as string;

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  // Verify monitor ownership
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)),
    columns: { id: true },
  });

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  // Get linked channels via join table
  const links = await db.query.monitorAlertChannels.findMany({
    where: eq(monitorAlertChannels.monitorId, monitorId),
    with: { alertChannel: true },
  });

  const channels = links.map((link) => link.alertChannel);

  res.json({ channels });
});

// ─── PUT /api/monitors/:monitorId/channels — Set linked channels ───

monitorChannelRouter.put('/', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const monitorId = req.params['monitorId'] as string;

  const parsed = associateChannelsSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  // Verify monitor ownership
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)),
    columns: { id: true },
  });

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  // Verify all channel IDs belong to this user
  const ownedChannels = await db.query.alertChannels.findMany({
    where: and(
      eq(alertChannels.userId, user.id),
      inArray(alertChannels.id, parsed.data.channelIds),
    ),
    columns: { id: true },
  });

  const ownedIds = new Set(ownedChannels.map((c) => c.id));
  const invalidIds = parsed.data.channelIds.filter((id) => !ownedIds.has(id));
  if (invalidIds.length > 0) {
    res.status(400).json({
      error: 'Some channel IDs are invalid or not owned by you',
      invalidIds,
    });
    return;
  }

  // Replace all associations: delete existing, insert new
  await db.delete(monitorAlertChannels).where(eq(monitorAlertChannels.monitorId, monitorId));

  if (parsed.data.channelIds.length > 0) {
    await db.insert(monitorAlertChannels).values(
      parsed.data.channelIds.map((channelId) => ({
        monitorId,
        alertChannelId: channelId,
      })),
    );
  }

  console.log(
    `[alert-channels] Associated ${String(parsed.data.channelIds.length)} channels to monitor=${monitorId} user=${clerkId}`,
  );

  res.json({ associated: parsed.data.channelIds });
});

// ─── DELETE /api/monitors/:monitorId/channels — Remove all links ───

monitorChannelRouter.delete('/', async (req: Request, res: Response) => {
  const clerkId = getUserId(res);
  const monitorId = req.params['monitorId'] as string;

  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(403).json({ error: 'User not provisioned' });
    return;
  }

  // Verify monitor ownership
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, user.id)),
    columns: { id: true },
  });

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  await db.delete(monitorAlertChannels).where(eq(monitorAlertChannels.monitorId, monitorId));

  console.log(`[alert-channels] Removed all channels from monitor=${monitorId} user=${clerkId}`);

  res.json({ dissociated: true });
});

export { alertChannelRouter, monitorChannelRouter };
