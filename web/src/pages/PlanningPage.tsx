import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError, cancelReservation, createMaintenance, createReservation, deleteMaintenance, errorMessage, fetchEquipment, fetchPlanning } from '../api';
import { useAuth } from '../auth/AuthProvider';
import {
  addDays,
  at,
  formatDay,
  formatShortDay,
  formatTime,
  fromDateInput,
  hhmm,
  nextSlot,
  SLOT_STARTS,
  startOfWeek,
  toDateInput,
} from '../dates';
import { ZONE_LABELS, type EquipmentDetail, type Maintenance, type Reservation } from '../types';

/**
 * Le planning d'un équipement, semaine par semaine, en créneaux de 30 minutes.
 * On voit qui a réservé quoi, on réserve un créneau libre, et un gestionnaire
 * met l'équipement en maintenance.
 */
export const PlanningPage = () => {
  const { id } = useParams() as { id: string };
  const { token, user } = useAuth();
  const [monday, setMonday] = useState(() => startOfWeek(new Date()));
  // Cliquer sur une case libre préremplit le formulaire.
  const [picked, setPicked] = useState<{ day: Date; minutes: number } | null>(null);
  // Cliquer sur une réservation (la sienne, ou n'importe laquelle pour un gestionnaire) l'ouvre en dessous.
  const [selected, setSelected] = useState<Reservation | null>(null);

  const equipment = useQuery({ queryKey: ['equipment', id], queryFn: () => fetchEquipment(id, token!) });
  const planning = useQuery({
    queryKey: ['planning', id, monday.toISOString()],
    queryFn: () => fetchPlanning(id, monday, addDays(monday, 5), token!),
  });

  if (equipment.isPending) return <p role="status">Chargement…</p>;
  if (equipment.isError) {
    return (
      <section className="page">
        <Link className="back" to="/">← Retour aux équipements</Link>
        <p className="error" role="alert">
          {equipment.error instanceof ApiError && equipment.error.status === 404
            ? 'Équipement introuvable.'
            : errorMessage(equipment.error)}
        </p>
      </section>
    );
  }

  const eq = equipment.data;
  const canBook = eq.habilitated || user?.role === 'manager';

  return (
    <section className="page">
      <Link className="back" to="/">← Retour aux équipements</Link>
      <header className="detail-header">
        <h2 className="detail-title">
          {eq.code} · {eq.name}
        </h2>
        <span className="badge">{ZONE_LABELS[eq.zone]}</span>
        {eq.status === 'MAINTENANCE' ? (
          <span className="tag tag-warn">En maintenance</span>
        ) : (
          <span className="tag tag-ok">Disponible</span>
        )}
      </header>

      <div className="week-nav">
        <button className="filter" type="button" onClick={() => setMonday(addDays(monday, -7))}>
          ← Semaine précédente
        </button>
        <span>Semaine du {formatDay(monday)}</span>
        <button className="filter" type="button" onClick={() => setMonday(addDays(monday, 7))}>
          Semaine suivante →
        </button>
      </div>

      {planning.isError && <p className="error" role="alert">{errorMessage(planning.error)}</p>}
      <WeekGrid
        monday={monday}
        reservations={planning.data ?? []}
        maintenances={eq.maintenances}
        myId={user?.sub}
        onPick={canBook ? (day, minutes) => setPicked({ day, minutes }) : undefined}
        canOpen={(r) => r.user.id === user?.sub || user?.role === 'manager'}
        onOpen={setSelected}
      />

      {selected && <SelectedReservation reservation={selected} onClose={() => setSelected(null)} />}

      {canBook ? (
        <ReservationForm key={picked ? `${picked.day.toISOString()}-${picked.minutes}` : 'empty'} equipment={eq} picked={picked} />
      ) : (
        <p className="hint" role="note">
          Vous n'êtes pas habilité sur cet équipement : demandez une formation à Claire ou Bruno pour pouvoir le réserver.
        </p>
      )}

      {user?.role === 'manager' && <MaintenancePanel equipment={eq} />}
    </section>
  );
};

interface WeekGridProps {
  monday: Date;
  reservations: Reservation[];
  maintenances: Maintenance[];
  myId?: string;
  onPick?: (day: Date, minutes: number) => void;
  canOpen?: (reservation: Reservation) => boolean;
  onOpen?: (reservation: Reservation) => void;
}

/** La grille : 5 jours × 26 créneaux de 30 minutes, de 7 h à 20 h. */
const WeekGrid = ({ monday, reservations, maintenances, myId, onPick, canOpen, onOpen }: WeekGridProps) => {
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
  const now = new Date();

  const covering = <T extends { start: string; end: string }>(items: T[], time: Date) =>
    items.find((item) => new Date(item.start) <= time && time < new Date(item.end));

  return (
    <div className="week-scroll">
      <table className="week">
        <thead>
          <tr>
            <th scope="col">Heure</th>
            {days.map((day) => (
              <th key={day.toISOString()} scope="col">
                {formatShortDay(day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOT_STARTS.map((minutes) => (
            <tr key={minutes}>
              <th scope="row">{hhmm(minutes)}</th>
              {days.map((day) => {
                const time = at(day, minutes);
                const maintenance = covering(maintenances, time);
                const reservation = covering(reservations, time);
                const past = at(day, minutes + 30) <= now;
                if (maintenance) {
                  return (
                    <td key={day.toISOString()} className="slot slot-maintenance" title={maintenance.reason}>
                      Maintenance
                    </td>
                  );
                }
                if (reservation) {
                  const mine = reservation.user.id === myId;
                  const label = mine ? 'Moi' : reservation.user.name;
                  return (
                    <td key={day.toISOString()} className={mine ? 'slot slot-mine' : 'slot slot-taken'} title={reservation.note}>
                      {onOpen && canOpen?.(reservation) ? (
                        <button
                          className="slot-open"
                          type="button"
                          aria-label={`Voir la réservation de ${reservation.user.name}, ${formatShortDay(day)} à ${hhmm(minutes)}`}
                          onClick={() => onOpen(reservation)}
                        >
                          {label}
                        </button>
                      ) : (
                        label
                      )}
                    </td>
                  );
                }
                return (
                  <td key={day.toISOString()} className={past ? 'slot slot-past' : 'slot slot-free'}>
                    {!past && onPick && (
                      <button
                        className="slot-button"
                        type="button"
                        aria-label={`Réserver ${formatShortDay(day)} à ${hhmm(minutes)}`}
                        onClick={() => onPick(day, minutes)}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ReservationFormProps {
  equipment: EquipmentDetail;
  picked: { day: Date; minutes: number } | null;
}

interface SelectedReservationProps {
  reservation: Reservation;
  onClose: () => void;
}

/**
 * Une réservation ouverte depuis la grille. Son auteur la libère ; un
 * gestionnaire peut annuler celle de n'importe qui, par exemple un créneau où
 * personne n'est venu (Claire : « tout voir et pouvoir tout modifier »).
 * L'API refait la vérification : elle seule décide qui peut annuler quoi.
 */
const SelectedReservation = ({ reservation, onClose }: SelectedReservationProps) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const mine = reservation.user.id === user?.sub;

  const cancel = useMutation({
    mutationFn: () => cancelReservation(reservation.id, token!),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onClose();
    },
  });

  return (
    <section className="panel" aria-label="Réservation sélectionnée">
      <p>
        <strong>{mine ? 'Ma réservation' : `Réservation de ${reservation.user.name}`}</strong> :{' '}
        {formatDay(reservation.start)}, {formatTime(reservation.start)} – {formatTime(reservation.end)}
        {reservation.note && <> · {reservation.note}</>}
      </p>
      <div className="actions">
        <button className="button button-danger" type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
          {mine ? 'Libérer le créneau' : 'Annuler cette réservation'}
        </button>
        <button className="link-button" type="button" onClick={onClose}>
          Fermer
        </button>
      </div>
      {cancel.isError && (
        <p className="error" role="alert">
          {errorMessage(cancel.error)}
        </p>
      )}
    </section>
  );
};

/** Réserver : un jour, une heure de début, une heure de fin. L'API vérifie toutes les règles. */
const ReservationForm = ({ equipment, picked }: ReservationFormProps) => {
  const { token, user, logout } = useAuth();
  const queryClient = useQueryClient();
  // Sans case cliquée, on propose le prochain créneau possible, pas une heure déjà passée.
  const initial = picked ?? nextSlot(new Date());
  const [day, setDay] = useState(toDateInput(initial.day));
  const [start, setStart] = useState(initial.minutes);
  const [end, setEnd] = useState(Math.min(initial.minutes + 60, 20 * 60));
  const [note, setNote] = useState('');

  const reserve = useMutation({
    mutationFn: () =>
      createReservation(
        {
          equipmentId: equipment.id,
          start: at(fromDateInput(day), start).toISOString(),
          end: at(fromDateInput(day), end).toISOString(),
          note: note || undefined,
        },
        token!,
      ),
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) logout();
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    reserve.mutate();
  };

  const ends = [...SLOT_STARTS.slice(1), 20 * 60];

  return (
    <form className="form inline-form" onSubmit={handleSubmit} aria-label="Réserver un créneau">
      <h3>Réserver</h3>
      <div className="field">
        <label htmlFor="res-day">Jour</label>
        <input id="res-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="res-start">Début</label>
        <select
          id="res-start"
          value={start}
          onChange={(e) => {
            const value = Number(e.target.value);
            setStart(value);
            // La fin suit le début : jamais une fin avant le début dans le formulaire.
            if (end <= value) setEnd(value + 30);
          }}
        >
          {SLOT_STARTS.map((m) => (
            <option key={m} value={m}>
              {hhmm(m)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="res-end">Fin</label>
        <select id="res-end" value={end} onChange={(e) => setEnd(Number(e.target.value))}>
          {ends.map((m) => (
            <option key={m} value={m}>
              {hhmm(m)}
            </option>
          ))}
        </select>
      </div>
      {user?.role === 'manager' && (
        <div className="field">
          <label htmlFor="res-note">Note (ex. entreprise)</label>
          <input id="res-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
        </div>
      )}
      <button className="button" type="submit" disabled={reserve.isPending}>
        Réserver
      </button>
      {reserve.isError && (
        <p className="error" role="alert">
          {errorMessage(reserve.error)}
        </p>
      )}
      {reserve.isSuccess && (
        <p className="success" role="status">
          Réservé le {formatDay(reserve.data.start)}, de {formatTime(reserve.data.start)} à {formatTime(reserve.data.end)}.
        </p>
      )}
    </form>
  );
};

/** Pour les gestionnaires : mettre l'équipement en maintenance, ou retirer une maintenance. */
const MaintenancePanel = ({ equipment }: { equipment: EquipmentDetail }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  const create = useMutation({
    mutationFn: () =>
      createMaintenance(
        equipment.id,
        // datetime-local donne une heure locale sans fuseau : new Date() la lit en heure locale.
        { start: new Date(start).toISOString(), end: new Date(end).toISOString(), reason },
        token!,
      ),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMaintenance(id, token!),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <section className="maintenance" aria-label="Maintenance">
      <h3>Maintenance</h3>
      {equipment.maintenances.length === 0 ? (
        <p className="hint">Aucune maintenance prévue.</p>
      ) : (
        <ul className="maintenance-list">
          {equipment.maintenances.map((m) => (
            <li key={m.id}>
              Du {formatDay(m.start)} {formatTime(m.start)} au {formatDay(m.end)} {formatTime(m.end)} : {m.reason}{' '}
              <button className="link-button" type="button" onClick={() => remove.mutate(m.id)}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="form inline-form" onSubmit={handleSubmit} aria-label="Mettre en maintenance">
        <div className="field">
          <label htmlFor="mnt-start">Début</label>
          <input id="mnt-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="mnt-end">Fin</label>
          <input id="mnt-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="mnt-reason">Raison</label>
          <input id="mnt-reason" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} required />
        </div>
        <button className="button" type="submit" disabled={create.isPending}>
          Mettre en maintenance
        </button>
        {create.isError && <p className="error" role="alert">{errorMessage(create.error)}</p>}
        {create.isSuccess && (
          <p className="success" role="status">
            Maintenance enregistrée. {create.data.cancelledReservations} réservation(s) annulée(s) : leurs auteurs le
            verront dans « Mes réservations ».
          </p>
        )}
      </form>
    </section>
  );
};
