import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { Webhook } from 'svix';

import { db, users } from '../db/index.js';

// ─── Clerk webhook event types ─────────────────────────────────────

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserEventData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserEventData;
}

// ─── Router ────────────────────────────────────────────────────────

const webhookRouter = Router();

/**
 * Clerk webhook handler — syncs user records on create/update/delete.
 *
 * IMPORTANT: This route uses express.raw() for body parsing because
 * Svix HMAC verification requires the raw request bytes.
 * It must be registered BEFORE express.json() in the middleware chain.
 */
webhookRouter.post('/clerk', async (req: Request, res: Response) => {
  const secret = process.env['CLERK_WEBHOOK_SIGNING_SECRET'];

  if (!secret) {
    console.error('[webhooks] CLERK_WEBHOOK_SIGNING_SECRET is not configured');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  // ─── Verify Svix signature ────────────────────────────────────

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (
    typeof svixId !== 'string' ||
    typeof svixTimestamp !== 'string' ||
    typeof svixSignature !== 'string'
  ) {
    res.status(400).json({ error: 'Missing svix headers' });
    return;
  }

  let event: ClerkWebhookEvent;

  try {
    const wh = new Webhook(secret);
    event = wh.verify(req.body as string | Buffer, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    console.warn('[webhooks] Invalid Clerk webhook signature');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  // ─── Handle event ─────────────────────────────────────────────

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await handleUserUpsert(event.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(event.data.id);
        break;

      default:
        // Acknowledge events we don't handle — prevents Svix retries
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[webhooks] Error handling ${event.type}:`, message);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ─── Handlers ──────────────────────────────────────────────────────

function getPrimaryEmail(data: ClerkUserEventData): string {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);

  if (!primary) {
    throw new Error(`No primary email found for Clerk user ${data.id}`);
  }

  return primary.email_address;
}

async function handleUserUpsert(data: ClerkUserEventData): Promise<void> {
  const email = getPrimaryEmail(data);

  await db
    .insert(users)
    .values({
      clerkId: data.id,
      email,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email,
        updatedAt: new Date(),
      },
    });

  console.log(`[webhooks] User upserted: ${data.id}`);
}

async function handleUserDeleted(clerkId: string): Promise<void> {
  const deleted = await db
    .delete(users)
    .where(eq(users.clerkId, clerkId))
    .returning({ id: users.id });

  if (deleted.length > 0) {
    console.log(`[webhooks] User deleted: ${clerkId}`);
  } else {
    console.warn(`[webhooks] User not found for deletion: ${clerkId}`);
  }
}

export { webhookRouter };
