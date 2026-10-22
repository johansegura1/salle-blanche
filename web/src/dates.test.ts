import { describe, expect, it } from 'vitest';
import { addDays, at, fromDateInput, hhmm, SLOT_STARTS, startOfWeek, toDateInput } from './dates';

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
});
