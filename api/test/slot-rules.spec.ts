import { parisDate } from '../src/common/paris-time.js';
import { checkSlot, overlaps } from '../src/reservations/slot-rules.js';

/**
 * Les règles d'un créneau, sans base ni serveur. « Maintenant » est fixé au
 * mercredi 21 octobre 2026, 9 h à Paris : les tests ne dépendent pas du jour.
 */
const now = parisDate('2026-10-21', 9);
const at = (day: string, h: number, m = 0) => parisDate(day, h, m);

describe('checkSlot', () => {
  it('accepte jeudi de 8 h à 10 h', () => {
    expect(checkSlot(at('2026-10-22', 8), at('2026-10-22', 10), now)).toBeNull();
  });

  it('accepte une journée entière, de 7 h à 20 h : pas de durée maximale', () => {
    expect(checkSlot(at('2026-10-22', 7), at('2026-10-22', 20), now)).toBeNull();
  });

  it('refuse une heure qui ne tombe ni à l’heure pile ni à la demie', () => {
    expect(checkSlot(at('2026-10-22', 8, 15), at('2026-10-22', 9), now)).toMatch(/30 minutes/);
  });

  it('refuse une fin avant le début', () => {
    expect(checkSlot(at('2026-10-22', 10), at('2026-10-22', 9), now)).toMatch(/après le début/);
  });

  it('accepte 19 h 30 - 20 h, refuse 19 h 30 - 20 h 30 : la borne se teste des deux côtés', () => {
    expect(checkSlot(at('2026-10-22', 19, 30), at('2026-10-22', 20), now)).toBeNull();
    expect(checkSlot(at('2026-10-22', 19, 30), at('2026-10-22', 20, 30), now)).toMatch(/7 h à 20 h/);
  });

  it('refuse avant 7 h', () => {
    expect(checkSlot(at('2026-10-22', 6, 30), at('2026-10-22', 8), now)).toMatch(/7 h à 20 h/);
  });

  it('refuse le samedi et le dimanche', () => {
    expect(checkSlot(at('2026-10-24', 8), at('2026-10-24', 9), now)).toMatch(/week-end/);
    expect(checkSlot(at('2026-10-25', 8), at('2026-10-25', 9), now)).toMatch(/week-end/);
  });

  it('refuse une réservation sur deux jours', () => {
    expect(checkSlot(at('2026-10-22', 18), at('2026-10-23', 9), now)).toMatch(/une seule journée/);
  });

  it('refuse le passé', () => {
    expect(checkSlot(at('2026-10-20', 8), at('2026-10-20', 9), now)).toMatch(/passé/);
  });

  it('accepte à 14 jours, refuse au-delà', () => {
    expect(checkSlot(at('2026-11-04', 8), at('2026-11-04', 9), now)).toBeNull();
    expect(checkSlot(at('2026-11-05', 8), at('2026-11-05', 9), now)).toMatch(/deux semaines/);
  });

  it('lit les heures à Paris, même après le changement d’heure du 25 octobre', () => {
    expect(checkSlot(at('2026-10-26', 7), at('2026-10-26', 8), now)).toBeNull();
  });
});

describe('overlaps', () => {
  const d = '2026-10-22';
  it('9 h-10 h et 9 h 30-11 h se chevauchent', () => {
    expect(overlaps(at(d, 9), at(d, 10), at(d, 9, 30), at(d, 11))).toBe(true);
  });
  it('9 h-10 h et 10 h-11 h ne se chevauchent pas : on peut enchaîner', () => {
    expect(overlaps(at(d, 9), at(d, 10), at(d, 10), at(d, 11))).toBe(false);
  });
  it('un créneau inclus dans un autre le chevauche', () => {
    expect(overlaps(at(d, 8), at(d, 12), at(d, 9), at(d, 10))).toBe(true);
  });
});
