import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { errorMessage, fetchEquipments, fetchHabilitations, fetchUsers, grantHabilitation, revokeHabilitation } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { ZONE_LABELS } from '../types';

/**
 * Pour les gestionnaires : après une formation, cocher l'équipement sur
 * lequel la personne est habilitée. Décocher retire l'habilitation.
 */
export const HabilitationsPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');

  const users = useQuery({ queryKey: ['users'], queryFn: () => fetchUsers(token!) });
  const equipments = useQuery({ queryKey: ['equipments', undefined], queryFn: () => fetchEquipments(token!) });
  const habilitations = useQuery({
    queryKey: ['habilitations', userId],
    queryFn: () => fetchHabilitations(userId, token!),
    enabled: userId !== '',
  });

  const toggle = useMutation({
    mutationFn: async (equipmentId: string) => {
      const existing = habilitations.data?.find((h) => h.equipment.id === equipmentId);
      if (existing) await revokeHabilitation(existing.id, token!);
      else await grantHabilitation(userId, equipmentId, token!);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habilitations', userId] }),
  });

  // Les gestionnaires réservent sans habilitation : on ne liste que les autres.
  const people = users.data?.filter((u) => u.role === 'user') ?? [];
  const granted = new Set(habilitations.data?.map((h) => h.equipment.id));

  return (
    <section className="page">
      <h2>Habilitations</h2>
      {(users.isError || equipments.isError) && (
        <p className="error" role="alert">{errorMessage(users.error ?? equipments.error)}</p>
      )}

      <div className="field narrow">
        <label htmlFor="hab-user">Personne</label>
        <select id="hab-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Choisir une personne…</option>
          {people.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.username})
            </option>
          ))}
        </select>
      </div>

      {toggle.isError && <p className="error" role="alert">{errorMessage(toggle.error)}</p>}

      {userId && habilitations.isPending && <p role="status">Chargement…</p>}
      {userId && habilitations.data && equipments.data && (
        <table className="table">
          <thead>
            <tr>
              <th>Habilité</th>
              <th>Équipement</th>
              <th>Zone</th>
            </tr>
          </thead>
          <tbody>
            {equipments.data.map((eq) => (
              <tr key={eq.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${eq.code} ${eq.name}`}
                    checked={granted.has(eq.id)}
                    disabled={toggle.isPending}
                    onChange={() => toggle.mutate(eq.id)}
                  />
                </td>
                <td>
                  {eq.code} · {eq.name}
                </td>
                <td>{ZONE_LABELS[eq.zone]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
