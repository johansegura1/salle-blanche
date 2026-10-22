import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { four } from '../fixtures.test-data';
import { fakeApi, managerToken, nestError, renderApp, userToken } from '../test-utils';

describe('Les pages protégées', () => {
  it('envoient un utilisateur déconnecté vers la connexion', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });

  it('reviennent à la page demandée une fois connecté', async () => {
    fakeApi({
      'POST /auth/login': () => Response.json({ access_token: userToken() }),
      'GET /reservations/mine': () => Response.json([]),
    });
    renderApp('/me/reservations');

    await userEvent.type(screen.getByLabelText('Identifiant'), 'lea');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('heading', { name: 'Mes réservations' })).toBeInTheDocument();
  });

  it('ne renvoient pas un utilisateur vers la page d’un gestionnaire après sa connexion', async () => {
    fakeApi({
      'POST /auth/login': () => Response.json({ access_token: userToken() }),
      'GET /equipments': () => Response.json([four]),
    });
    renderApp('/admin/habilitations');

    await userEvent.type(screen.getByLabelText('Identifiant'), 'lea');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('group', { name: 'Filtrer par zone' })).toBeInTheDocument();
  });

  it('affichent « Identifiant ou mot de passe incorrect. » sur un 401', async () => {
    fakeApi({ 'POST /auth/login': () => nestError(401, 'Wrong username or password') });
    renderApp('/login');

    await userEvent.type(screen.getByLabelText('Identifiant'), 'lea');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'faux');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiant ou mot de passe incorrect.');
  });

  it('réservent la page des habilitations aux gestionnaires', () => {
    fakeApi({ 'GET /equipments': () => Response.json([four]) });
    renderApp('/admin/habilitations', { token: userToken() });
    expect(screen.getByRole('alert')).toHaveTextContent('réservée aux gestionnaires');
  });

  it('montrent le lien « Habilitations » aux gestionnaires seulement', async () => {
    fakeApi({ 'GET /equipments': () => Response.json([four]) });
    const { unmount } = renderApp('/', { token: managerToken() });
    expect(screen.getByRole('link', { name: 'Habilitations' })).toBeInTheDocument();
    expect(screen.getByText(/Claire Martin/)).toBeInTheDocument();
    unmount();

    renderApp('/', { token: userToken() });
    expect(screen.queryByRole('link', { name: 'Habilitations' })).not.toBeInTheDocument();
  });
});
