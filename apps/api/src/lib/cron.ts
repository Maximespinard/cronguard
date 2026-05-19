import { CronExpressionParser } from 'cron-parser';

/**
 * Compute the next expected ping time from a cron expression + timezone.
 */
export function computeNextExpected(schedule: string, timezone: string): Date {
  const interval = CronExpressionParser.parse(schedule, { tz: timezone });
  return interval.next().toDate();
}
