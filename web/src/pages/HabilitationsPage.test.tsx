import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { aligneur, four } from '../fixtures.test-data';
import { fakeApi, managerToken, renderApp } from '../test-utils';

const noah = { id: 'user-noah', username: 'noah', name: 'Noah Bernard', role: 'user' };
const claire = { id: 'user-claire', username: 'claire', name: 'Claire Martin', role: 'manager' };

describe('HabilitationsPage', () => {
  it('coche les habilitations d’une personne, et en accorde une nouvelle', async () => {
    const requests = fakeApi({
      'GET /users': () => Response.json([claire, noah]),
      'GET /equipments': () => Response.json([four, aligneur]),
      'GET /habilitations?userId=user-noah': () =>
        Response.json([{ id: 'h1', userId: 'user-noah', equipment: four, grantedBy: 'claire', grantedAt: '' }]),
      'POST /habilitations': () => Response.json({}, { status: 201 }),
    });
    renderApp('/admin/habilitations', { token: managerToken() });

    // Les gestionnaires ne sont pas dans la liste : ils réservent sans habilitation.
    const select = await screen.findByLabelText('Personne');
    expect(await screen.findByRole('option', { name: 'Noah Bernard (noah)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Claire/ })).not.toBeInTheDocument();

    await userEvent.selectOptions(select, 'user-noah');
    expect(await screen.findByRole('checkbox', { name: 'SB-010 Four de recuit' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'SB-020 Aligneur UV' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'SB-020 Aligneur UV' }));

    const post = requests.find((r) => r.method === 'POST');
    expect(await post?.json()).toEqual({ userId: 'user-noah', equipmentId: 'eq-aligneur' });
  });
});
