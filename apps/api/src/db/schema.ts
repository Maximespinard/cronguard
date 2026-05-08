import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Enums ──────────────────────────────────────────────────────────

export const monitorStatusEnum = pgEnum('monitor_status', ['new', 'up', 'down', 'paused', 'grace']);

export const pingKindEnum = pgEnum('ping_kind', ['success', 'start', 'fail']);

export const alertChannelTypeEnum = pgEnum('alert_channel_type', [
  'email',
  'slack',
  'discord',
  'webhook',
]);

export const alertTypeEnum = pgEnum('alert_type', ['miss', 'recovery']);

export const alertStatusEnum = pgEnum('alert_status', ['pending', 'sent', 'failed']);

export const planTierEnum = pgEnum('plan_tier', ['free', 'pro', 'team']);

// ─── Tables ─────────────────────────────────────────────────────────

/**
 * Users — synced from Clerk on first auth.
 * Stores plan tier and Stripe identifiers.
 */
export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    clerkId: varchar('clerk_id', { length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    planTier: planTierEnum('plan_tier').notNull().default('free'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('users_clerk_id_uidx').on(table.clerkId),
    index('users_email_idx').on(table.email),
  ],
);

/**
 * Monitors — the core entity. Each monitor has a unique slug
 * used as the ping endpoint identifier.
 */
export const monitors = pgTable(
  'monitors',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 21 }).notNull(),
    schedule: varchar({ length: 255 }).notNull(),
    timezone: varchar({ length: 100 }).notNull().default('UTC'),
    gracePeriod: integer('grace_period').notNull().default(300),
    status: monitorStatusEnum().notNull().default('new'),
    lastPingAt: timestamp('last_ping_at', { withTimezone: true }),
    nextExpectedPingAt: timestamp('next_expected_ping_at', {
      withTimezone: true,
    }),
    alertSentAt: timestamp('alert_sent_at', { withTimezone: true }),
    isPaused: boolean('is_paused').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('monitors_slug_uidx').on(table.slug),
    index('monitors_user_id_idx').on(table.userId),
    // The critical scheduler query: find monitors that are overdue
    index('monitors_miss_detection_idx')
      .on(table.nextExpectedPingAt, table.gracePeriod)
      .where(sql`${table.status} NOT IN ('paused', 'new')`),
  ],
);

/**
 * Pings — immutable log of every heartbeat received.
 * High-volume table, partitioned by time for retention cleanup.
 */
export const pings = pgTable(
  'pings',
  {
    id: uuid().primaryKey().defaultRandom(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    kind: pingKindEnum().notNull().default('success'),
    sourceIp: varchar('source_ip', { length: 45 }),
    duration: integer(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index: "last N pings for this monitor" query
    index('pings_monitor_received_idx').on(table.monitorId, table.receivedAt.desc()),
    // Retention cleanup: DELETE WHERE received_at < cutoff
    index('pings_received_at_idx').on(table.receivedAt),
  ],
);

/**
 * Alert channels — user-configured notification destinations.
 * Config is JSONB to accommodate different channel shapes.
 */
export const alertChannels = pgTable(
  'alert_channels',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: alertChannelTypeEnum().notNull(),
    name: varchar({ length: 255 }).notNull(),
    config: jsonb()
      .notNull()
      .$type<
        { email: string } | { webhookUrl: string } | { webhookUrl: string; channel?: string }
      >(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('alert_channels_user_id_idx').on(table.userId)],
);

/**
 * Join table: which alert channels are attached to which monitors.
 * Composite PK — no surrogate ID needed.
 */
export const monitorAlertChannels = pgTable(
  'monitor_alert_channels',
  {
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    alertChannelId: uuid('alert_channel_id')
      .notNull()
      .references(() => alertChannels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite unique constraint acts as PK
    uniqueIndex('mac_monitor_channel_uidx').on(table.monitorId, table.alertChannelId),
    index('mac_alert_channel_id_idx').on(table.alertChannelId),
  ],
);

/**
 * Alerts — log of every notification dispatched.
 * missKey provides idempotent dispatch: INSERT ON CONFLICT DO NOTHING.
 */
export const alerts = pgTable(
  'alerts',
  {
    id: uuid().primaryKey().defaultRandom(),
    monitorId: uuid('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    alertChannelId: uuid('alert_channel_id').references(() => alertChannels.id, {
      onDelete: 'set null',
    }),
    type: alertTypeEnum().notNull(),
    status: alertStatusEnum().notNull().default('pending'),
    missKey: varchar('miss_key', { length: 64 }),
    message: text(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Idempotent alert dispatch: one alert per monitor per miss window
    uniqueIndex('alerts_monitor_miss_key_uidx').on(table.monitorId, table.missKey),
    index('alerts_monitor_id_idx').on(table.monitorId),
    index('alerts_created_at_idx').on(table.createdAt),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  monitors: many(monitors),
  alertChannels: many(alertChannels),
}));

export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  user: one(users, {
    fields: [monitors.userId],
    references: [users.id],
  }),
  pings: many(pings),
  monitorAlertChannels: many(monitorAlertChannels),
  alerts: many(alerts),
}));

export const pingsRelations = relations(pings, ({ one }) => ({
  monitor: one(monitors, {
    fields: [pings.monitorId],
    references: [monitors.id],
  }),
}));

export const alertChannelsRelations = relations(alertChannels, ({ one, many }) => ({
  user: one(users, {
    fields: [alertChannels.userId],
    references: [users.id],
  }),
  monitorAlertChannels: many(monitorAlertChannels),
}));

export const monitorAlertChannelsRelations = relations(monitorAlertChannels, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorAlertChannels.monitorId],
    references: [monitors.id],
  }),
  alertChannel: one(alertChannels, {
    fields: [monitorAlertChannels.alertChannelId],
    references: [alertChannels.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  monitor: one(monitors, {
    fields: [alerts.monitorId],
    references: [monitors.id],
  }),
  alertChannel: one(alertChannels, {
    fields: [alerts.alertChannelId],
    references: [alertChannels.id],
  }),
}));
