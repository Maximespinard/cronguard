import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAlertChannel } from '../../test/fixtures';
import { renderWithProviders } from '../../test/utils';

const useAlertChannelsMock = vi.fn();
const deleteMutateMock = vi.fn();

vi.mock('../../hooks/use-alert-channels', () => ({
  useAlertChannels: () => useAlertChannelsMock(),
  useDeleteAlertChannel: () => ({ mutate: deleteMutateMock, isPending: false }),
  useCreateAlertChannel: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { AlertChannelList } from './alert-channel-list';

describe('AlertChannelList', () => {
  beforeEach(() => {
    useAlertChannelsMock.mockReset();
    deleteMutateMock.mockReset();
  });

  it('renders empty state when there are no channels', () => {
    useAlertChannelsMock.mockReturnValue({ data: { channels: [] } });

    renderWithProviders(<AlertChannelList />);

    expect(screen.getByText('No alert channels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add channel/i })).toBeInTheDocument();
  });

  it('renders one card per channel with name and active/disabled state', () => {
    useAlertChannelsMock.mockReturnValue({
      data: {
        channels: [
          makeAlertChannel({ id: 'c1', name: 'Ops email', type: 'email', isEnabled: true }),
          makeAlertChannel({ id: 'c2', name: 'Slack #ops', type: 'slack', isEnabled: false }),
          makeAlertChannel({ id: 'c3', name: 'PagerDuty hook', type: 'webhook' }),
        ],
      },
    });

    renderWithProviders(<AlertChannelList />);

    expect(screen.getByText('Ops email')).toBeInTheDocument();
    expect(screen.getByText('Slack #ops')).toBeInTheDocument();
    expect(screen.getByText('PagerDuty hook')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('opens the delete dialog and invokes the delete mutation on confirm', async () => {
    const user = userEvent.setup();
    useAlertChannelsMock.mockReturnValue({
      data: {
        channels: [makeAlertChannel({ id: 'c1', name: 'Ops email' })],
      },
    });

    renderWithProviders(<AlertChannelList />);

    await user.click(screen.getByRole('button', { name: /delete$/i }));

    expect(
      await screen.findByRole('heading', { name: /delete alert channel/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete channel/i }));

    expect(deleteMutateMock).toHaveBeenCalledTimes(1);
    expect(deleteMutateMock.mock.calls[0]?.[0]).toBe('c1');
  });
});
