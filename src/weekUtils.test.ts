import { describe, expect, it } from 'vitest';
import type { MealPlanEntry } from './types';
import {
  formatDayLabel,
  formatWeekLabel,
  getMinWeekOffset,
  getWeekDates,
  getWeekStart,
  toDateKey,
} from './weekUtils';

const entry = (plan_date: string): MealPlanEntry =>
  ({ id: plan_date, plan_date, recipe_id: 'r', position: 0 }) as MealPlanEntry;

describe('weekUtils', () => {
  it('toDateKey nutzt das lokale Datum', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('Woche beginnt am Samstag', () => {
    // 7.10.2026 ist ein Mittwoch -> Samstag davor ist der 3.10.
    expect(toDateKey(getWeekStart(new Date(2026, 9, 7)))).toBe('2026-10-03');
    // Samstag selbst ist der Wochenanfang
    expect(toDateKey(getWeekStart(new Date(2026, 9, 3)))).toBe('2026-10-03');
    // Freitag gehört noch zur alten Woche
    expect(toDateKey(getWeekStart(new Date(2026, 9, 9)))).toBe('2026-10-03');
    expect(toDateKey(getWeekStart(new Date(2026, 9, 10)))).toBe('2026-10-10');
  });

  it('getWeekDates liefert sieben aufeinanderfolgende Tage', () => {
    const days = getWeekDates(new Date(2026, 9, 3));
    expect(days).toHaveLength(7);
    expect(days.map(toDateKey)).toEqual([
      '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09',
    ]);
  });

  it('Labels', () => {
    expect(formatDayLabel(new Date(2026, 9, 3))).toBe('3.10.');
    expect(formatWeekLabel(0)).toBe('Diese Woche');
    expect(formatWeekLabel(1)).toBe('Nächste Woche');
    expect(formatWeekLabel(-1)).toBe('Letzte Woche');
    expect(formatWeekLabel(-3)).toBe('Vor 3 Wochen');
  });

  it('getMinWeekOffset reicht bis zur Woche des ältesten Eintrags', () => {
    const current = getWeekStart(new Date(2026, 9, 7)); // 3.10.
    expect(getMinWeekOffset([], current)).toBe(0);
    expect(getMinWeekOffset([entry('2026-10-05')], current)).toBe(0);
    expect(getMinWeekOffset([entry('2026-10-02')], current)).toBe(-1);
    expect(getMinWeekOffset([entry('2026-09-10'), entry('2026-10-02')], current)).toBe(-4);
  });
});
