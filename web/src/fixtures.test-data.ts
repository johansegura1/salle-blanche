import { addDays, at, startOfWeek } from './dates';
import type { Equipment, EquipmentDetail, Reservation } from './types';

/** Des données d'exemple pour les tests du front. */
export const four: Equipment = {
  id: 'eq-four',
  code: 'SB-010',
  name: 'Four de recuit',
  zone: 'FABRICATION',
  status: 'AVAILABLE',
  habilitated: true,
};

export const aligneur: Equipment = {
  id: 'eq-aligneur',
  code: 'SB-020',
  name: 'Aligneur UV',
  zone: 'LITHOGRAPHIE',
  status: 'MAINTENANCE',
  habilitated: false,
};

export const fourDetail: EquipmentDetail = { ...four, maintenances: [] };

/** Mercredi de la semaine en cours, de 9 h à 11 h : visible sur la grille de la semaine. */
const wednesday = addDays(startOfWeek(new Date()), 2);
export const bobReservation: Reservation = {
  id: 'res-1',
  equipment: { id: 'eq-four', code: 'SB-010', name: 'Four de recuit' },
  user: { id: 'user-bob', name: 'Bob Petit' },
  start: at(wednesday, 9 * 60).toISOString(),
  end: at(wednesday, 11 * 60).toISOString(),
  status: 'ACTIVE',
};
