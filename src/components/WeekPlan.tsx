import { useMemo, useState } from 'react';
import type { MealPlanEntry, Recipe } from '../types';
import { COLORS, SHADOWS } from '../theme';
import PrimaryButton from './ui/PrimaryButton';
import DayCard from './week/DayCard';
import RecipePicker from './week/RecipePicker';
import {
  formatDayLabel,
  formatWeekLabel,
  getMinWeekOffset,
  getWeekDates,
  getWeekStart,
  MAX_WEEK_OFFSET,
  toDateKey,
} from '../weekUtils';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  recipes: Recipe[];
  entries: MealPlanEntry[];
  loading: boolean;
  onAssign: (planDate: string, recipeId: string, position: number) => void;
  onClear: (planDate: string, position: number) => void;
  onAddWeekToShoppingList: (groups: { source: string; lines: string[] }[]) => void;
  onCreateRecipe: (planDate: string, position: number, suggestedName: string) => void;
  onSelectRecipe: (id: string) => void;
}

export default function WeekPlan({
  recipes,
  entries,
  loading,
  onAssign,
  onClear,
  onAddWeekToShoppingList,
  onCreateRecipe,
  onSelectRecipe,
}: Props) {
  // Wofür gerade ein Rezept gewählt wird (Tag + 0 = Hauptgericht, 1.. = Extra)
  const [picker, setPicker] = useState<{ date: string; position: number } | null>(null);
  // 0 = aktuelle Woche, -1 = letzte Woche, +1 = nächste Woche (weiter in die Zukunft nicht)
  const [weekOffset, setWeekOffset] = useState(0);

  const todayKey = toDateKey(new Date());
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);

  const weekStart = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + weekOffset * 7);
    return d;
  }, [currentWeekStart, weekOffset]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  // Vergangene Wochen sind nur lesbar; geplant wird in der aktuellen und der nächsten Woche.
  const isPastWeek = weekOffset < 0;

  // Wie weit man zurückblättern kann: bis zur Woche des ältesten Eintrags.
  const minOffset = useMemo(() => getMinWeekOffset(entries, currentWeekStart), [entries, currentWeekStart]);

  const weekLabel = formatWeekLabel(weekOffset);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, MealPlanEntry[]>();
    for (const e of entries) {
      const list = map.get(e.plan_date) ?? [];
      list.push(e);
      map.set(e.plan_date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [entries]);

  const recipeById = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of recipes) map.set(r.id, r);
    return map;
  }, [recipes]);

  // Alle Einträge der Woche (Hauptgerichte + Extras) für die Einkaufsliste;
  // Extras ohne Hauptgericht werden nirgends angezeigt und deshalb auch nicht mitgezählt.
  const assignedInWeek = weekDates.flatMap((d) => {
    const list = entriesByDate.get(toDateKey(d)) ?? [];
    return list.some((e) => e.position === 0) ? list : [];
  });

  const handleCreateShoppingList = () => {
    // Pro Plan-Slot eine Quelle: so wird nichts doppelt eingerechnet, wenn man den Button
    // erneut drückt, und neu geplante Gerichte kommen trotzdem dazu.
    const groups: { source: string; lines: string[] }[] = [];
    for (const entry of assignedInWeek) {
      const recipe = recipeById.get(entry.recipe_id);
      if (!recipe) continue;
      const lines = recipe.ingredients
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      groups.push({
        source: `week:${entry.plan_date}:${entry.position}:${entry.recipe_id}`,
        lines,
      });
    }
    onAddWeekToShoppingList(groups);
  };

  const handleCreateRecipe = (suggestedName: string) => {
    if (!picker) return;
    const { date, position } = picker;
    setPicker(null);
    onCreateRecipe(date, position, suggestedName);
  };

  const handlePick = (recipeId: string) => {
    if (!picker) return;
    onAssign(picker.date, recipeId, picker.position);
    setPicker(null);
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 pt-12 pb-4"
        style={{ backgroundColor: COLORS.bg }}
      >
        <h1
          className="text-xl font-bold"
          style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Wochenplan
        </h1>
      </div>

      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((o) => Math.max(minOffset, o - 1))}
            disabled={weekOffset <= minOffset}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-30"
            style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.raised }}
            aria-label="Vorherige Woche"
          >
            <ChevronLeft size={20} strokeWidth={2} color={COLORS.ink} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: COLORS.ink }}>
              {formatDayLabel(weekDates[0])} – {formatDayLabel(weekDates[6])}
            </p>
            <p className="text-xs" style={{ color: COLORS.muted }}>
              {weekLabel}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset((o) => Math.min(MAX_WEEK_OFFSET, o + 1))}
            disabled={weekOffset >= MAX_WEEK_OFFSET}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-30"
            style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.raised }}
            aria-label="Nächste Woche"
          >
            <ChevronRight size={20} strokeWidth={2} color={COLORS.ink} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {weekDates.map((d, i) => {
              const key = toDateKey(d);
              return (
                <DayCard
                  key={key}
                  date={d}
                  weekdayIndex={i}
                  isToday={key === todayKey}
                  readOnly={isPastWeek}
                  entries={entriesByDate.get(key) ?? []}
                  recipeById={recipeById}
                  onSelectRecipe={onSelectRecipe}
                  onClear={onClear}
                  onOpenPicker={(date, position) => setPicker({ date, position })}
                />
              );
            })}
          </div>
        )}

        {!isPastWeek && (
        <PrimaryButton onClick={handleCreateShoppingList} disabled={assignedInWeek.length === 0}>
          <ShoppingCart size={18} strokeWidth={2} />
          Einkaufsliste für die Woche erstellen
        </PrimaryButton>
        )}

      </div>

      {picker && (
        <RecipePicker
          recipes={recipes}
          position={picker.position}
          onPick={handlePick}
          onCreate={handleCreateRecipe}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
