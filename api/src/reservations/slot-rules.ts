import { parisTime } from '../common/paris-time.js';

/**
 * Les règles d'un créneau, données par Claire dans le fil du sujet :
 * créneaux de 30 minutes, du lundi au vendredi, de 7 h à 20 h, au plus deux
 * semaines à l'avance, sans durée maximale. Des fonctions pures : elles se
 * testent sans base ni serveur (test/slot-rules.spec.ts).
 */
export const OPENING_MINUTES = 7 * 60; // 7 h
export const CLOSING_MINUTES = 20 * 60; // 20 h
export const MAX_DAYS_AHEAD = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** [a, b[ et [c, d[ se chevauchent si a < d et c < b. 9 h-10 h et 10 h-11 h ne se chevauchent pas. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** null si le créneau est valide, sinon la raison, telle que l'utilisateur la lira. */
export function checkSlot(start: Date, end: Date, now: Date = new Date()): string | null {
  if (!(end > start)) return 'La fin doit être après le début.';
  for (const date of [start, end]) {
    if (date.getUTCMinutes() % 30 !== 0 || date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
      return 'Les créneaux sont de 30 minutes : début et fin à l’heure pile ou à la demie.';
    }
  }

  const from = parisTime(start);
  const to = parisTime(end);
  if (from.day !== to.day) return 'Une réservation tient sur une seule journée.';
  if (from.weekday === 0 || from.weekday === 6) return 'La salle est fermée le week-end.';
  if (from.minutes < OPENING_MINUTES || to.minutes > CLOSING_MINUTES) {
    return 'La salle est ouverte de 7 h à 20 h.';
  }

  if (start < now) return 'Impossible de réserver dans le passé.';
  if (start.getTime() - now.getTime() > MAX_DAYS_AHEAD * DAY_MS) {
    return 'On réserve au plus deux semaines à l’avance.';
  }
  return null;
}
