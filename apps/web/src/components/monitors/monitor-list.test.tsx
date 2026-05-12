import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMonitor } from '../../test/fixtures';
import { renderWithProviders } from '../../test/utils';

// Stub TanStack Router's Link to a plain anchor — no router context in tests.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: { children: ReactNode; to?: string }) => (
    <a href={to ?? '#'} {...rest}>
      {children}
    </a>
  ),
}));

const useMonitorsMock = vi.fn();
vi.mock('../../hooks/use-monitors', () => ({
  useMonitors: () => useMonitorsMock(),
  useCreateMonitor: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

import { MonitorList } from './monitor-list';

describe('MonitorList', () => {
  beforeEach(() => {
    useMonitorsMock.mockReset();
  });

  it('renders empty state when there are no monitors', () => {
    useMonitorsMock.mockReturnValue({ data: { monitors: [] } });

    renderWithProviders(<MonitorList />);

    expect(screen.getByText('No monitors yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create monitor/i })).toBeInTheDocument();
  });

  it('renders a monitor card for each monitor with name, schedule, and ping URL', () => {
    useMonitorsMock.mockReturnValue({
      data: {
        monitors: [
          makeMonitor({ id: 'm1', name: 'Backup', slug: 'backup', schedule: '0 2 * * *' }),
          makeMonitor({ id: 'm2', name: 'Cleanup', slug: 'cleanup', schedule: '*/5 * * * *' }),
        ],
      },
    });

    renderWithProviders(<MonitorList />);

    expect(screen.getByText('Backup')).toBeInTheDocument();
    expect(screen.getByText('Cleanup')).toBeInTheDocument();
    expect(screen.getByText('0 2 * * *')).toBeInTheDocument();
    expect(screen.getByText('*/5 * * * *')).toBeInTheDocument();
    expect(screen.getByText('/api/ping/backup')).toBeInTheDocument();
    expect(screen.getByText('/api/ping/cleanup')).toBeInTheDocument();
  });

  it('formats the last-ping time as a relative duration', () => {
    useMonitorsMock.mockReturnValue({
      data: {
        monitors: [
          makeMonitor({
            id: 'm1',
            name: 'Recent',
            lastPingAt: new Date(Date.now() - 30 * 1000).toISOString(),
          }),
          makeMonitor({
            id: 'm2',
            name: 'Stale',
            lastPingAt: null,
          }),
        ],
      },
    });

    renderWithProviders(<MonitorList />);

    expect(screen.getByText(/\d+s ago/)).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });
});
