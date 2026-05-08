import { z } from 'zod';

// ─── Channel config schemas (discriminated by type) ─────────────

const emailConfigSchema = z.object({
  email: z.string().email('Must be a valid email address'),
});

const webhookUrlConfigSchema = z.object({
  webhookUrl: z.string().url('Must be a valid URL'),
});

const slackConfigSchema = z.object({
  webhookUrl: z.string().url('Must be a valid Slack webhook URL'),
  channel: z.string().max(255).optional(),
});

const discordConfigSchema = z.object({
  webhookUrl: z.string().url('Must be a valid Discord webhook URL'),
});

// ─── Type-to-config mapping ─────────────────────────────────────

export const CHANNEL_CONFIG_SCHEMAS = {
  email: emailConfigSchema,
  slack: slackConfigSchema,
  discord: discordConfigSchema,
  webhook: webhookUrlConfigSchema,
} as const;

export type ChannelType = keyof typeof CHANNEL_CONFIG_SCHEMAS;

export const CHANNEL_TYPES = ['email', 'slack', 'discord', 'webhook'] as const;

/**
 * Channel types available per plan tier.
 * Free gets email only; pro and team get all types.
 */
export const TIER_ALLOWED_CHANNELS: Record<string, readonly ChannelType[]> = {
  free: ['email'],
  pro: ['email', 'slack', 'discord', 'webhook'],
  team: ['email', 'slack', 'discord', 'webhook'],
};

// ─── Input schemas ──────────────────────────────────────────────

export const createAlertChannelSchema = z
  .object({
    type: z.enum(CHANNEL_TYPES),
    name: z.string().trim().min(1, 'Name is required').max(255),
    config: z.record(z.unknown()),
  })
  .refine(
    (data) => {
      const schema = CHANNEL_CONFIG_SCHEMAS[data.type];
      return schema.safeParse(data.config).success;
    },
    {
      message: 'Config does not match the selected channel type',
      path: ['config'],
    },
  );

export const updateAlertChannelSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255),
    config: z.record(z.unknown()),
    isEnabled: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Schema for associating channels to a monitor.
 * Accepts an array of channel IDs.
 */
export const associateChannelsSchema = z.object({
  channelIds: z
    .array(z.string().uuid('Each channel ID must be a valid UUID'))
    .min(1, 'At least one channel ID is required'),
});

export type CreateAlertChannelInput = z.infer<typeof createAlertChannelSchema>;
export type UpdateAlertChannelInput = z.infer<typeof updateAlertChannelSchema>;
export type AssociateChannelsInput = z.infer<typeof associateChannelsSchema>;
