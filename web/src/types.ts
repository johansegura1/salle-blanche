/** Les types que renvoie l'API : les mêmes champs que les « views » de l'API. */

export type Role = 'manager' | 'user';

export type Zone = 'PREPARATION' | 'FABRICATION' | 'LITHOGRAPHIE';
export const ZONES: Zone[] = ['PREPARATION', 'FABRICATION', 'LITHOGRAPHIE'];
export const ZONE_LABELS: Record<Zone, string> = {
  PREPARATION: 'Préparation',
  FABRICATION: 'Fabrication',
  LITHOGRAPHIE: 'Lithographie',
};

export interface Equipment {
  id: string;
  code: string;
  name: string;
  zone: Zone;
  status: 'AVAILABLE' | 'MAINTENANCE';
  /** L'utilisateur connecté est-il habilité dessus ? */
  habilitated: boolean;
}

/** Les dates arrivent en JSON : des chaînes ISO, pas des objets Date. */
export interface Maintenance {
  id: string;
  start: string;
  end: string;
  reason: string;
  createdBy: string;
}

export interface EquipmentDetail extends Equipment {
  maintenances: Maintenance[];
}

export interface Reservation {
  id: string;
  equipment: { id: string; code: string; name: string };
  user: { id: string; name: string };
  start: string;
  end: string;
  status: 'ACTIVE' | 'CANCELLED';
  note?: string;
  cancelReason?: string;
}

export interface NewReservation {
  equipmentId: string;
  start: string;
  end: string;
  note?: string;
}

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface Habilitation {
  id: string;
  userId: string;
  equipment: { id: string; code: string; name: string };
  grantedBy: string;
  grantedAt: string;
}
