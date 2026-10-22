import { describe, expect, it } from 'vitest';
import { addDays, at, fromDateInput, hhmm, nextSlot, SLOT_STARTS, startOfWeek, toDateInput } from './dates';

describe('dates', () => {
  it('26 créneaux de 30 minutes, de 7 h à 19 h 30', () => {
    expect(SLOT_STARTS).toHaveLength(26);
    expect(hhmm(SLOT_STARTS[0])).toBe('07:00');
    expect(hhmm(SLOT_STARTS[25])).toBe('19:30');
  });

  it('startOfWeek renvoie le lundi, même un dimanche', () => {
    expect(toDateInput(startOfWeek(new Date(2026, 9, 25)))).toBe('2026-10-19'); // dimanche 25 octobre
    expect(toDateInput(startOfWeek(new Date(2026, 9, 26, 15)))).toBe('2026-10-26'); // lundi
  });

  it('un input date se relit en heure locale', () => {
    const day = fromDateInput('2026-10-26');
    expect(at(day, 8 * 60 + 30).getHours()).toBe(8);
    expect(toDateInput(addDays(day, 1))).toBe('2026-10-27');
  });

  it('nextSlot propose la prochaine demi-heure, jamais une heure passée ni un week-end', () => {
    const show = (now: Date) => {
      const { day, minutes } = nextSlot(now);
      return `${toDateInput(day)} ${hhmm(minutes)}`;
    };
    expect(show(new Date(2026, 9, 22, 6, 10))).toBe('2026-10-22 07:00'); // jeudi, avant l'ouverture
    expect(show(new Date(2026, 9, 22, 10, 0))).toBe('2026-10-22 10:00'); // pile sur un créneau
    expect(show(new Date(2026, 9, 22, 18, 7))).toBe('2026-10-22 18:30');
    expect(show(new Date(2026, 9, 22, 19, 45))).toBe('2026-10-23 07:00'); // trop tard : le lendemain
    expect(show(new Date(2026, 9, 23, 19, 45))).toBe('2026-10-26 07:00'); // vendredi soir : lundi
    expect(show(new Date(2026, 9, 24, 11, 0))).toBe('2026-10-26 07:00'); // samedi : lundi
  });
});
