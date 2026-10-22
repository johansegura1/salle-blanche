/**
 * Les dates du planning, dans le fuseau du navigateur (Paris pour les
 * utilisateurs de la salle). L'API, elle, reçoit et renvoie de l'ISO en UTC.
 */

/** Les créneaux d'une journée : 7:00, 7:30, ... 19:30, en minutes depuis minuit. */
export const SLOT_STARTS: number[] = Array.from({ length: 26 }, (_, i) => 7 * 60 + i * 30);

/** "08:30" pour 510 minutes. */
export function hhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Le lundi à 0 h de la semaine de `date`. */
export function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (monday.getDay() + 6) % 7; // lundi = 0, dimanche = 6
  monday.setDate(monday.getDate() - shift);
  return monday;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Un jour à une heure donnée : at(lundi, 510) = lundi 8 h 30. */
export function at(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

/** "2026-10-26", pour un <input type="date"> : en heure locale, pas en UTC. */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** L'inverse : "2026-10-26" → le 26 octobre à 0 h, heure locale. */
export function fromDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDay(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShortDay(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
