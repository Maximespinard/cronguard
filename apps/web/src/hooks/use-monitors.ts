import type { CreateMonitorInput, UpdateMonitorInput } from '@cronguard/shared';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { api } from '../lib/api';
import type {
  DeleteResponse,
  MonitorDetailResponse,
  MonitorListResponse,
  MonitorMutationResponse,
} from '../lib/api-types';
import { monitorKeys } from '../lib/query-keys';

// ─── Query options (reusable) ─────────────────────────────────────

export const monitorsListOptions = queryOptions({
  queryKey: monitorKeys.list(),
  queryFn: () => api<MonitorListResponse>('/monitors'),
  refetchInterval: 60_000, // 60s polling
});

export function monitorDetailOptions(id: string) {
  return queryOptions({
    queryKey: monitorKeys.detail(id),
    queryFn: () => api<MonitorDetailResponse>(`/monitors/${id}`),
    refetchInterval: 30_000, // 30s polling
  });
}

// ─── Hooks ────────────────────────────────────────────────────────

export function useMonitors() {
  return useSuspenseQuery(monitorsListOptions);
}

export function useMonitor(id: string) {
  return useSuspenseQuery(monitorDetailOptions(id));
}

export function useCreateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMonitorInput) =>
      api<MonitorMutationResponse>('/monitors', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: monitorKeys.all });
    },
  });
}

export function useUpdateMonitor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMonitorInput) =>
      api<MonitorMutationResponse>(`/monitors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: monitorKeys.all });
    },
  });
}

export function useDeleteMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<DeleteResponse>(`/monitors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: monitorKeys.all });
    },
  });
}
