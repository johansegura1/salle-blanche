import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { errorMessage, fetchEquipments } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { ZONE_LABELS, ZONES, type Equipment, type Zone } from '../types';

/**
 * L'accueil : les équipements, par zone. D'un coup d'œil, où est un
 * équipement, s'il est disponible ou en maintenance, et si je suis habilité.
 */
export const EquipmentsPage = () => {
  const { token } = useAuth();
  const [zone, setZone] = useState<Zone | undefined>();

  const { data, error, isPending, isError } = useQuery({
    queryKey: ['equipments', zone],
    queryFn: () => fetchEquipments(token!, zone),
  });

  return (
    <section className="page">
      <div className="filters" role="group" aria-label="Filtrer par zone">
        <button className="filter" type="button" aria-pressed={zone === undefined} onClick={() => setZone(undefined)}>
          Toutes les zones
        </button>
        {ZONES.map((z) => (
          <button key={z} className="filter" type="button" aria-pressed={zone === z} onClick={() => setZone(z)}>
            {ZONE_LABELS[z]}
          </button>
        ))}
      </div>

      {isPending && <p role="status">Chargement…</p>}
      {isError && <p className="error" role="alert">Impossible de charger les équipements : {errorMessage(error)}</p>}
      {data && data.length === 0 && <p className="empty">Aucun équipement dans cette zone.</p>}
      {data && data.length > 0 && (
        <ul className="model-list">
          {data.map((equipment) => (
            <li key={equipment.id}>
              <EquipmentCard equipment={equipment} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const EquipmentCard = ({ equipment }: { equipment: Equipment }) => (
  <article className="card">
    <div className="card-header">
      <h2 className="card-title">
        <Link to={`/equipments/${equipment.id}`}>{equipment.name}</Link>
      </h2>
      <span className="badge">{ZONE_LABELS[equipment.zone]}</span>
    </div>
    <p className="card-org">{equipment.code}</p>
    <p className="card-tags">
      {equipment.status === 'MAINTENANCE' ? (
        <span className="tag tag-warn">En maintenance</span>
      ) : (
        <span className="tag tag-ok">Disponible</span>
      )}
      {equipment.habilitated ? <span className="tag">Habilité</span> : <span className="tag tag-muted">Non habilité</span>}
    </p>
  </article>
);
