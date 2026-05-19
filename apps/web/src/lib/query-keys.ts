/**
 * TanStack Query key factories.
 * Structured keys enable granular invalidation.
 */

export const monitorKeys = {
  all: ['monitors'] as const,
  list: () => [...monitorKeys.all, 'list'] as const,
  detail: (id: string) => [...monitorKeys.all, 'detail', id] as const,
  channels: (id: string) => [...monitorKeys.all, 'channels', id] as const,
};

export const alertChannelKeys = {
  all: ['alert-channels'] as const,
  list: () => [...alertChannelKeys.all, 'list'] as const,
};
