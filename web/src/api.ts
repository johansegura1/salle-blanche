import type {
  Equipment,
  EquipmentDetail,
  Habilitation,
  Maintenance,
  NewReservation,
  PublicUser,
  Reservation,
  Zone,
} from './types';

/** Où tourne l'API, lu dans `.env` (ou passé au build par Docker). */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Une réponse de l'API qui n'est pas ok : un 4xx ou un 5xx. `status` dit
 * lequel, `details` contient ce que l'API a expliqué (une phrase par champ
 * pour un 400, le message métier sinon : « Ce créneau est déjà réservé. »).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Ne fait rien si la réponse est ok, lève une ApiError sinon. */
export async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;

  const body: unknown = await res.json().catch(() => undefined);
  const message = body && typeof body === 'object' && 'message' in body ? body.message : undefined;
  const details = Array.isArray(message) ? message.map(String) : typeof message === 'string' ? [message] : [];
  throw new ApiError(res.status, details[0] ?? `L'API a répondu ${res.status}`, details);
}

/** La phrase à montrer à l'utilisateur pour une erreur : le message de l'API quand il y en a un. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.details.length > 0) return error.details.join(' ');
  return error instanceof Error ? error.message : String(error);
}

/**
 * Une requête avec le token. Toutes les routes, sauf /auth/login et /health,
 * demandent d'être connecté. Un 204 n'a pas de corps : on renvoie undefined.
 */
async function call<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  await throwIfNotOk(res);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** POST /auth/login : le token, ou une ApiError 401 pour un mauvais mot de passe. */
export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  await throwIfNotOk(res);
  return ((await res.json()) as { access_token: string }).access_token;
}

export const fetchEquipments = (token: string, zone?: Zone) =>
  call<Equipment[]>(zone ? `/equipments?zone=${zone}` : '/equipments', token);

export const fetchEquipment = (id: string, token: string) => call<EquipmentDetail>(`/equipments/${id}`, token);

export const fetchPlanning = (equipmentId: string, from: Date, to: Date, token: string) => {
  const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  return call<Reservation[]>(`/equipments/${equipmentId}/reservations?${query}`, token);
};

export const fetchMyReservations = (token: string) => call<Reservation[]>('/reservations/mine', token);

export const createReservation = (reservation: NewReservation, token: string) =>
  call<Reservation>('/reservations', token, { method: 'POST', body: reservation });

export const cancelReservation = (id: string, token: string) =>
  call<Reservation>(`/reservations/${id}`, token, { method: 'DELETE' });

export const createMaintenance = (
  equipmentId: string,
  maintenance: { start: string; end: string; reason: string },
  token: string,
) =>
  call<{ maintenance: Maintenance; cancelledReservations: number }>(`/equipments/${equipmentId}/maintenances`, token, {
    method: 'POST',
    body: maintenance,
  });

export const deleteMaintenance = (id: string, token: string) =>
  call<void>(`/maintenances/${id}`, token, { method: 'DELETE' });

export const fetchUsers = (token: string) => call<PublicUser[]>('/users', token);

export const fetchHabilitations = (userId: string, token: string) =>
  call<Habilitation[]>(`/habilitations?userId=${encodeURIComponent(userId)}`, token);

export const grantHabilitation = (userId: string, equipmentId: string, token: string) =>
  call<Habilitation>('/habilitations', token, { method: 'POST', body: { userId, equipmentId } });

export const revokeHabilitation = (id: string, token: string) =>
  call<void>(`/habilitations/${id}`, token, { method: 'DELETE' });
