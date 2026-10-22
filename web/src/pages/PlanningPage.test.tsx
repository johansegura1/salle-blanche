import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { bobReservation, fourDetail } from '../fixtures.test-data';
import { fakeApi, managerToken, nestError, renderApp, userToken } from '../test-utils';

const planningRoutes = (extra: Record<string, (r: Request) => Response> = {}) =>
  fakeApi({
    'GET /equipments/eq-four': () => Response.json(fourDetail),
    'GET /equipments/eq-four/reservations': () => Response.json([bobReservation]),
    ...extra,
  });

describe('PlanningPage', () => {
  it('montre la semaine, et qui a réservé quel créneau', async () => {
    planningRoutes();
    renderApp('/equipments/eq-four', { token: userToken() });

    expect(await screen.findByRole('heading', { name: 'SB-010 · Four de recuit' })).toBeInTheDocument();
    // 9 h-11 h : quatre créneaux de 30 minutes au nom de Bob.
    expect(await screen.findAllByText('Bob Petit')).toHaveLength(4);
  });

  it('envoie la réservation à l’API, au nom de personne d’autre que soi', async () => {
    const requests = planningRoutes({
      'POST /reservations': () => Response.json({ ...bobReservation, id: 'res-2' }, { status: 201 }),
    });
    renderApp('/equipments/eq-four', { token: userToken() });
    const form = await screen.findByRole('form', { name: 'Réserver un créneau' });

    await userEvent.selectOptions(within(form).getByLabelText('Début'), '08:00');
    await userEvent.selectOptions(within(form).getByLabelText('Fin'), '10:00');
    await userEvent.click(within(form).getByRole('button', { name: 'Réserver' }));

    expect(await within(form).findByRole('status')).toHaveTextContent('Réservé le');
    const post = requests.find((r) => r.method === 'POST')!;
    const body = await post.json();
    expect(body).toMatchObject({ equipmentId: 'eq-four' });
    expect(body).not.toHaveProperty('userId');
    expect(new Date(body.end).getTime() - new Date(body.start).getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it('affiche le message de l’API quand le créneau est déjà pris (409)', async () => {
    planningRoutes({ 'POST /reservations': () => nestError(409, 'Ce créneau est déjà réservé.') });
    renderApp('/equipments/eq-four', { token: userToken() });
    const form = await screen.findByRole('form', { name: 'Réserver un créneau' });

    await userEvent.click(within(form).getByRole('button', { name: 'Réserver' }));

    expect(await within(form).findByRole('alert')).toHaveTextContent('Ce créneau est déjà réservé.');
  });

  it('ne propose pas de réserver à qui n’est pas habilité', async () => {
    fakeApi({
      'GET /equipments/eq-four': () => Response.json({ ...fourDetail, habilitated: false }),
      'GET /equipments/eq-four/reservations': () => Response.json([]),
    });
    renderApp('/equipments/eq-four', { token: userToken() });

    expect(await screen.findByRole('note')).toHaveTextContent("Vous n'êtes pas habilité");
    expect(screen.queryByRole('form', { name: 'Réserver un créneau' })).not.toBeInTheDocument();
  });

  it('montre la maintenance aux gestionnaires seulement', async () => {
    planningRoutes();
    const { unmount } = renderApp('/equipments/eq-four', { token: managerToken() });
    expect(await screen.findByRole('form', { name: 'Mettre en maintenance' })).toBeInTheDocument();
    unmount();

    planningRoutes();
    renderApp('/equipments/eq-four', { token: userToken() });
    await screen.findByRole('form', { name: 'Réserver un créneau' });
    expect(screen.queryByRole('form', { name: 'Mettre en maintenance' })).not.toBeInTheDocument();
  });

  it('dit « Équipement introuvable. » sur un 404', async () => {
    fakeApi({ 'GET /equipments/inconnu': () => nestError(404, 'Équipement introuvable.') });
    renderApp('/equipments/inconnu', { token: userToken() });
    expect(await screen.findByRole('alert')).toHaveTextContent('Équipement introuvable.');
  });
});
