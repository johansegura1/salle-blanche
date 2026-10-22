/** Les trois zones de propreté, de la moins à la plus exigeante. */
export type Zone = 'PREPARATION' | 'FABRICATION' | 'LITHOGRAPHIE';
export const ZONES: Zone[] = ['PREPARATION', 'FABRICATION', 'LITHOGRAPHIE'];

export type EquipmentStatus = 'AVAILABLE' | 'MAINTENANCE';

export interface MaintenanceView {
  id: string;
  start: Date;
  end: Date;
  reason: string;
  createdBy: string;
}

export interface EquipmentView {
  id: string;
  code: string;
  name: string;
  zone: Zone;
  /** Calculé à chaque lecture, jamais stocké : il ne peut pas être faux. */
  status: EquipmentStatus;
  /** L'utilisateur connecté est-il habilité sur cet équipement ? */
  habilitated: boolean;
}

export interface EquipmentDetail extends EquipmentView {
  /** Les maintenances en cours et à venir. */
  maintenances: MaintenanceView[];
}
