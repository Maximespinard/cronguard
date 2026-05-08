import { z } from 'zod';

/**
 * Optional metadata sent with a ping request body.
 * All fields are optional — most pings send an empty body or just a kind.
 * output is capped at 10KB to prevent abuse.
 */
export const pingBodySchema = z.object({
  kind: z.enum(['success', 'start', 'fail']).optional().default('success'),
  metadata: z
    .object({
      status: z.string().optional(),
      duration: z.number().optional(),
      exitCode: z.number().int().optional(),
      output: z.string().max(10_240).optional(),
      env: z.record(z.string()).optional(),
      host: z.string().optional(),
    })
    .optional(),
});

export type PingBody = z.infer<typeof pingBodySchema>;
