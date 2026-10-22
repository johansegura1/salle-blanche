import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { addDays, at } from '../dates';
import type { Reservation } from '../types';
import { fakeApi, pathOf, renderApp, userToken } from '../test-utils';

const tomorrow = addDays(new Date(), 1);
const mine: Reservation = {
  id: 'res-1',
  equipment: { id: 'eq-four', code: 'SB-010', name: 'Four de recuit' },
  user: { id: 'user-lea', name: 'Léa Dubois' },
  start: at(tomorrow, 8 * 60).toISOString(),
  end: at(tomorrow, 10 * 60).toISOString(),
  status: 'ACTIVE',
};
const cancelled: Reservation = {
  ...mine,
  id: 'res-2',
  status: 'CANCELLED',
  cancelReason: 'Maintenance : Changement de thermocouple',
};

describe('MyReservationsPage', () => {
  it('montre une réservation annulée par une maintenance, avec la raison', async () => {
    fakeApi({ 'GET /reservations/mine': () => Response.json([mine, cancelled]) });
    renderApp('/me/reservations', { token: userToken() });

    expect(await screen.findByText('Maintenance : Changement de thermocouple')).toBeInTheDocument();
    expect(screen.getByText('Annulée')).toBeInTheDocument();
    expect(screen.getByText('Confirmée')).toBeInTheDocument();
  });

  it('libère un créneau : DELETE /reservations/:id', async () => {
    const requests = fakeApi({
      'GET /reservations/mine': () => Response.json([mine]),
      'DELETE /reservations/res-1': () => Response.json({ ...mine, status: 'CANCELLED' }),
    });
    renderApp('/me/reservations', { token: userToken() });

    await userEvent.click(await screen.findByRole('button', { name: 'Libérer le créneau' }));

    await screen.findByRole('button', { name: 'Libérer le créneau' });
    expect(requests.some((r) => r.method === 'DELETE' && pathOf(r) === '/reservations/res-1')).toBe(true);
  });
});
