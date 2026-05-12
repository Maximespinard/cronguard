import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '../../lib/api';
import { renderWithProviders } from '../../test/utils';

const mutateMock = vi.fn();
const useCreateMonitorMock = vi.fn();

vi.mock('../../hooks/use-monitors', () => ({
  useCreateMonitor: () => useCreateMonitorMock(),
}));

import { Button } from '../ui/button';

import { CreateMonitorDialog } from './create-monitor-dialog';

function setup() {
  return renderWithProviders(
    <CreateMonitorDialog>
      <Button>Open</Button>
    </CreateMonitorDialog>,
  );
}

describe('CreateMonitorDialog', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useCreateMonitorMock.mockReset();
    useCreateMonitorMock.mockReturnValue({ mutate: mutateMock, isPending: false });
  });

  it('opens the dialog when the trigger is clicked', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByRole('heading', { name: /create monitor/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cron schedule/i)).toBeInTheDocument();
  });

  it('submits typed values to the create-monitor mutation', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.type(screen.getByLabelText(/^name$/i), 'Backup');
    await user.type(screen.getByLabelText(/cron schedule/i), '0 2 * * *');

    await user.click(screen.getByRole('button', { name: /^create monitor$/i }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const firstCall = mutateMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const payload = firstCall![0];
    expect(payload).toEqual({
      name: 'Backup',
      schedule: '0 2 * * *',
      gracePeriod: 5,
      timezone: 'UTC',
    });
  });

  it('surfaces ApiRequestError messages from the mutation', async () => {
    const user = userEvent.setup();
    mutateMock.mockImplementation((_input: unknown, opts: { onError: (err: unknown) => void }) => {
      opts.onError(new ApiRequestError(400, { error: 'Schedule is invalid' }));
    });
    setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.type(screen.getByLabelText(/^name$/i), 'Backup');
    await user.type(screen.getByLabelText(/cron schedule/i), '0 2 * * *');
    await user.click(screen.getByRole('button', { name: /^create monitor$/i }));

    await waitFor(() => {
      expect(screen.getByText('Schedule is invalid')).toBeInTheDocument();
    });
  });

  it('disables submit while the mutation is pending', async () => {
    useCreateMonitorMock.mockReturnValue({ mutate: mutateMock, isPending: true });
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const submit = screen.getByRole('button', { name: /^create monitor$/i });
    expect(submit).toBeDisabled();
  });
});
