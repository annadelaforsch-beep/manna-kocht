import type { MealPlanEntry } from './types';

/** Die Woche beginnt am Samstag (Einkaufstag), nicht am Montag. */
export const WEEKDAY_LABELS = ['Sa', 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr'];

/** Wie weit man in die Zukunft planen kann: eine Woche. */
export const MAX_WEEK_OFFSET = 1;

/** Lokales Datum als "JJJJ-MM-TT" (kein UTC-Versatz wie bei toISOString). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Samstag (00:00 Uhr) der Woche, in der `d` liegt. */
export function getWeekStart(d: Date): Date {
  const day = d.getDay(); // 0=So .. 6=Sa
  const diff = (day + 1) % 7; // Tage seit dem letzten Samstag
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(d.getDate() - diff);
  return start;
}

/** Die sieben Tage einer Woche ab dem Samstag `weekStart`. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

/** z. B. "3.10." */
export function formatDayLabel(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

/** 0 = aktuelle Woche, -1 = letzte, +1 = nächste. */
export function formatWeekLabel(weekOffset: number): string {
  if (weekOffset === 0) return 'Diese Woche';
  if (weekOffset === 1) return 'Nächste Woche';
  if (weekOffset === -1) return 'Letzte Woche';
  return `Vor ${-weekOffset} Wochen`;
}

/** Kleinster Wochen-Offset (≤ 0), bis zu dem man zurückblättern kann: die Woche des ältesten Eintrags. */
export function getMinWeekOffset(entries: MealPlanEntry[], currentWeekStart: Date): number {
  const currentWeekStartKey = toDateKey(currentWeekStart);
  let earliest: string | null = null;
  for (const e of entries) if (!earliest || e.plan_date < earliest) earliest = e.plan_date;
  if (!earliest || earliest >= currentWeekStartKey) return 0;
  const earliestWeekStart = getWeekStart(new Date(`${earliest}T00:00:00`));
  const diffDays = Math.round((currentWeekStart.getTime() - earliestWeekStart.getTime()) / 86400000);
  return -Math.round(diffDays / 7);
}
