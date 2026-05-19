import type { CreateAlertChannelInput, UpdateAlertChannelInput } from '@cronguard/shared';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { api } from '../lib/api';
import type {
  AssociateChannelsResponse,
  ChannelListResponse,
  ChannelMutationResponse,
  DeleteResponse,
} from '../lib/api-types';
import { alertChannelKeys, monitorKeys } from '../lib/query-keys';

// ─── Query options ────────────────────────────────────────────────

export const channelsListOptions = queryOptions({
  queryKey: alertChannelKeys.list(),
  queryFn: () => api<ChannelListResponse>('/alert-channels'),
});

export function monitorChannelsOptions(monitorId: string) {
  return queryOptions({
    queryKey: monitorKeys.channels(monitorId),
    queryFn: () => api<ChannelListResponse>(`/monitors/${monitorId}/channels`),
  });
}

// ─── Hooks ────────────────────────────────────────────────────────

export function useAlertChannels() {
  return useSuspenseQuery(channelsListOptions);
}

export function useMonitorChannels(monitorId: string) {
  return useSuspenseQuery(monitorChannelsOptions(monitorId));
}

export function useCreateAlertChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlertChannelInput) =>
      api<ChannelMutationResponse>('/alert-channels', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: alertChannelKeys.all });
    },
  });
}

export function useUpdateAlertChannel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAlertChannelInput) =>
      api<ChannelMutationResponse>(`/alert-channels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: alertChannelKeys.all });
    },
  });
}

export function useDeleteAlertChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<DeleteResponse>(`/alert-channels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: alertChannelKeys.all });
    },
  });
}

export function useAssociateChannels(monitorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelIds: string[]) =>
      api<AssociateChannelsResponse>(`/monitors/${monitorId}/channels`, {
        method: 'PUT',
        body: JSON.stringify({ channelIds }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: monitorKeys.channels(monitorId) });
    },
  });
}
