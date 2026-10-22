import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { aligneur, four } from '../fixtures.test-data';
import { fakeApi, nestError, pathOf, renderApp, userToken } from '../test-utils';

describe('EquipmentsPage', () => {
  it('liste les équipements, avec leur statut et l’habilitation', async () => {
    fakeApi({ 'GET /equipments': () => Response.json([four, aligneur]) });
    renderApp('/', { token: userToken() });

    expect(await screen.findByRole('link', { name: 'Four de recuit' })).toHaveAttribute('href', '/equipments/eq-four');
    expect(screen.getByText('En maintenance')).toBeInTheDocument();
    expect(screen.getByText('Non habilité')).toBeInTheDocument();
  });

  it('envoie le token, et filtre par zone côté serveur', async () => {
    const requests = fakeApi({
      'GET /equipments': () => Response.json([four, aligneur]),
      'GET /equipments?zone=LITHOGRAPHIE': () => Response.json([aligneur]),
    });
    renderApp('/', { token: userToken() });
    await screen.findByText('Four de recuit');

    await userEvent.click(screen.getByRole('button', { name: 'Lithographie' }));

    expect(await screen.findByText('Aligneur UV')).toBeInTheDocument();
    expect(screen.queryByText('Four de recuit')).not.toBeInTheDocument();
    expect(requests.map(pathOf)).toContain('/equipments?zone=LITHOGRAPHIE');
    expect(requests[0].headers.get('Authorization')).toMatch(/^Bearer /);
  });

  it('affiche une erreur quand l’API ne répond pas', async () => {
    fakeApi({ 'GET /equipments': () => nestError(500, 'Internal server error') });
    renderApp('/', { token: userToken() });
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les équipements');
  });
});
