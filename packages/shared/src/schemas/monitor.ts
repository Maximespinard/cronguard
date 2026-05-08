import { z } from 'zod';

/**
 * Validates a standard 5-field cron expression.
 * Does not validate field ranges — cron-parser handles that server-side
 * when computing nextExpectedPingAt.
 */
const cronExpression = z
  .string()
  .min(1)
  .max(255)
  .regex(/^\S+(\s+\S+){4}$/, 'Must be a valid cron expression (5 fields)');

/**
 * Validates an IANA timezone identifier (e.g. "America/New_York").
 * Uses Intl.DateTimeFormat for runtime validation — no external deps.
 */
const ianaTimezone = z
  .string()
  .max(100)
  .refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid IANA timezone (e.g. "America/New_York")' },
  );

/**
 * Input schema for creating a new monitor.
 * gracePeriod is in minutes (1–60, default 5).
 * The API layer converts to seconds before DB insert.
 */
export const createMonitorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  schedule: cronExpression,
  gracePeriod: z.number().int().min(1).max(60).optional().default(5),
  timezone: ianaTimezone.optional().default('UTC'),
});

/**
 * Input schema for updating an existing monitor.
 * All fields optional — only provided fields are updated.
 */
export const updateMonitorSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255),
    schedule: cronExpression,
    gracePeriod: z.number().int().min(1).max(60),
    timezone: ianaTimezone,
  })
  .partial();

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
