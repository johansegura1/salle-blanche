export type ReservationStatus = 'ACTIVE' | 'CANCELLED';

export interface ReservationView {
  id: string;
  equipment: { id: string; code: string; name: string };
  user: { id: string; name: string };
  start: Date;
  end: Date;
  status: ReservationStatus;
  note?: string;
  cancelReason?: string;
}
