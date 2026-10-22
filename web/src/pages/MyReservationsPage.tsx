import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { cancelReservation, errorMessage, fetchMyReservations } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { formatDay, formatTime } from '../dates';
import type { Reservation } from '../types';

/**
 * Mes réservations, à venir et passées, annulées comprises : c'est ici que
 * je vois qu'une maintenance a annulé la mienne, et pourquoi. Et c'est ici
 * que je libère un créneau dont je n'ai plus besoin.
 */
export const MyReservationsPage = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, error, isPending, isError } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => fetchMyReservations(token!),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelReservation(id, token!),
    // Le planning et mes réservations ont changé : TanStack Query les recharge.
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const now = new Date();
    // L'API trie du plus récent au plus ancien : bien pour « Passées ».
  // « À venir » se lit dans l'autre sens, la prochaine réservation en premier.
  const upcoming = data?.filter((r) => new Date(r.end) > now).reverse() ?? [];
  const past = data?.filter((r) => new Date(r.end) <= now) ?? [];

  return (
    <section className="page">
      <h2>Mes réservations</h2>
      {isPending && <p role="status">Chargement…</p>}
      {isError && <p className="error" role="alert">{errorMessage(error)}</p>}
      {cancel.isError && <p className="error" role="alert">{errorMessage(cancel.error)}</p>}
      {data && data.length === 0 && (
        <p className="empty">
          Aucune réservation pour l'instant. <Link to="/">Choisir un équipement</Link>
        </p>
      )}

      {upcoming.length > 0 && (
        <>
          <h3>À venir</h3>
          <ReservationTable
            reservations={upcoming}
            onCancel={(id) => cancel.mutate(id)}
            cancelling={cancel.isPending ? cancel.variables : undefined}
          />
        </>
      )}
      {past.length > 0 && (
        <>
          <h3>Passées</h3>
          <ReservationTable reservations={past} />
        </>
      )}
    </section>
  );
};

interface ReservationTableProps {
  reservations: Reservation[];
  onCancel?: (id: string) => void;
  cancelling?: string;
}

const ReservationTable = ({ reservations, onCancel, cancelling }: ReservationTableProps) => (
  <table className="table">
    <thead>
      <tr>
        <th>Équipement</th>
        <th>Jour</th>
        <th>Horaire</th>
        <th>État</th>
        {onCancel && <th aria-label="Actions" />}
      </tr>
    </thead>
    <tbody>
      {reservations.map((r) => (
        <tr key={r.id} className={r.status === 'CANCELLED' ? 'cancelled' : undefined}>
          <td>
            <Link to={`/equipments/${r.equipment.id}`}>
              {r.equipment.code} · {r.equipment.name}
            </Link>
            {r.note && <div className="field-hint">{r.note}</div>}
          </td>
          <td>{formatDay(r.start)}</td>
          <td>
            {formatTime(r.start)} – {formatTime(r.end)}
          </td>
          <td>
            {r.status === 'ACTIVE' ? (
              <span className="tag tag-ok">Confirmée</span>
            ) : (
              <>
                <span className="tag tag-warn">Annulée</span>
                {r.cancelReason && <div className="field-hint">{r.cancelReason}</div>}
              </>
            )}
          </td>
          {onCancel && (
            <td>
              {r.status === 'ACTIVE' && (
                <button className="link-button" type="button" disabled={cancelling === r.id} onClick={() => onCancel(r.id)}>
                  Libérer le créneau
                </button>
              )}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);
