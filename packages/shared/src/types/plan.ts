export const PlanTier = {
  free: 'free',
  pro: 'pro',
  team: 'team',
} as const;

export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export interface PlanLimits {
  monitors: number;
  alertChannels: number;
  retentionDays: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    monitors: 5,
    alertChannels: 1,
    retentionDays: 7,
  },
  pro: {
    monitors: 50,
    alertChannels: 5,
    retentionDays: 30,
  },
  team: {
    monitors: 200,
    alertChannels: 10,
    retentionDays: 90,
  },
};
