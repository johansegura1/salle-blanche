/**
 * Les horaires de la salle (lundi-vendredi, 7 h-20 h) sont des heures de
 * Paris. On les lit toujours dans ce fuseau, quel que soit celui de la machine
 * qui fait tourner l'API (un conteneur Docker est en UTC par défaut).
 */
const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ParisTime {
  /** 0 = dimanche, 1 = lundi, ..., 6 = samedi */
  weekday: number;
  /** "2026-10-23" : sert à comparer deux jours */
  day: string;
  /** minutes depuis minuit : 7 h 30 = 450 */
  minutes: number;
}

export function parisTime(date: Date): ParisTime {
  const parts = Object.fromEntries(FORMAT.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: WEEKDAYS.indexOf(parts.weekday),
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** L'instant qui correspond à une heure de Paris : parisDate('2026-10-23', 8, 30). */
export function parisDate(day: string, hour: number, minute = 0): Date {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  // Paris est à UTC+1 en hiver, UTC+2 en été : on garde le décalage qui tombe juste.
  for (const offset of ['+02:00', '+01:00']) {
    const candidate = new Date(`${day}T${hh}:${mm}:00${offset}`);
    if (parisTime(candidate).minutes === hour * 60 + minute) return candidate;
  }
  throw new Error(`Heure invalide à Paris : ${day} ${hh}:${mm}`);
}
