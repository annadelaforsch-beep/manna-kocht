import { useMemo, useState } from 'react';
import type { MealPlanEntry, Recipe } from '../types';
import { COLORS, getCategoryTint } from '../theme';
import { getRecipeIcon } from '../icons';
import { useVisualViewport } from '../useVisualViewport';
import { ShoppingCart, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Props {
  recipes: Recipe[];
  entries: MealPlanEntry[];
  loading: boolean;
  onAssign: (planDate: string, recipeId: string) => void;
  onClear: (planDate: string) => void;
  onAddWeekToShoppingList: (ingredientLines: string[]) => void;
  onCreateRecipe: (planDate: string, suggestedName: string) => void;
  onSelectRecipe: (id: string) => void;
}

const WEEKDAY_LABELS = ['Sa', 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr'];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Die Woche beginnt am Samstag (Einkaufstag), nicht am Montag.
function getWeekStart(d: Date): Date {
  const day = d.getDay(); // 0=So .. 6=Sa
  const diff = (day + 1) % 7; // Tage seit dem letzten Samstag
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(d.getDate() - diff);
  return start;
}

function formatDayLabel(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
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
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  // 0 = aktuelle Woche, -1 = letzte Woche, +1 = nächste Woche (weiter in die Zukunft nicht)
  const [weekOffset, setWeekOffset] = useState(0);
  const viewport = useVisualViewport();

  const todayKey = toDateKey(new Date());
  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
  const currentWeekStartKey = toDateKey(currentWeekStart);

  const weekStart = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + weekOffset * 7);
    return d;
  }, [currentWeekStart, weekOffset]);
  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  // Vergangene Wochen sind nur lesbar; geplant wird in der aktuellen und der nächsten Woche.
  const isPastWeek = weekOffset < 0;
  const MAX_OFFSET = 1;

  // Wie weit man zurückblättern kann: bis zur Woche des ältesten Eintrags.
  const minOffset = useMemo(() => {
    let earliest: string | null = null;
    for (const e of entries) if (!earliest || e.plan_date < earliest) earliest = e.plan_date;
    if (!earliest || earliest >= currentWeekStartKey) return 0;
    const earliestWeekStart = getWeekStart(new Date(`${earliest}T00:00:00`));
    const diffDays = Math.round((currentWeekStart.getTime() - earliestWeekStart.getTime()) / 86400000);
    return -Math.round(diffDays / 7);
  }, [entries, currentWeekStart, currentWeekStartKey]);

  const weekLabel =
    weekOffset === 0
      ? 'Diese Woche'
      : weekOffset === 1
        ? 'Nächste Woche'
        : weekOffset === -1
          ? 'Letzte Woche'
          : `Vor ${-weekOffset} Wochen`;

  const entryByDate = useMemo(() => {
    const map = new Map<string, MealPlanEntry>();
    for (const e of entries) map.set(e.plan_date, e);
    return map;
  }, [entries]);

  const recipeById = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of recipes) map.set(r.id, r);
    return map;
  }, [recipes]);

  const assignedInWeek = weekDates
    .map((d) => entryByDate.get(toDateKey(d)))
    .filter((e): e is MealPlanEntry => Boolean(e));

  const handleCreateShoppingList = () => {
    const lines: string[] = [];
    for (const entry of assignedInWeek) {
      const recipe = recipeById.get(entry.recipe_id);
      if (!recipe) continue;
      const ingredientLines = recipe.ingredients
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      lines.push(...ingredientLines);
    }
    onAddWeekToShoppingList(lines);
  };

  const filteredPickerRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

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
            style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
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
            onClick={() => setWeekOffset((o) => Math.min(MAX_OFFSET, o + 1))}
            disabled={weekOffset >= MAX_OFFSET}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-30"
            style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
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
              const entry = entryByDate.get(key);
              const recipe = entry ? recipeById.get(entry.recipe_id) : undefined;
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className="rounded-2xl p-3 flex items-center gap-3"
                  style={{
                    backgroundColor: COLORS.surface,
                    boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
                    border: `2px solid ${isToday ? COLORS.primary : 'transparent'}`,
                  }}
                >
                  <div className="w-12 flex-shrink-0 text-center">
                    <div className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                      {WEEKDAY_LABELS[i]}
                    </div>
                    <div className="text-sm font-bold" style={{ color: COLORS.ink }}>
                      {formatDayLabel(d)}
                    </div>
                  </div>

                  {recipe ? (
                    <>
                      <button
                        onClick={() => onSelectRecipe(recipe.id)}
                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: getCategoryTint(recipe.category) }}
                        >
                          {recipe.image_url ? (
                            <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (() => {
                              const RecipeIcon = getRecipeIcon(recipe.emoji);
                              return <RecipeIcon size={18} strokeWidth={1.75} color={COLORS.primary} />;
                            })()
                          )}
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: COLORS.ink }}>
                          {recipe.name}
                        </span>
                      </button>
                      {!isPastWeek && (
                        <button
                          onClick={() => onClear(key)}
                          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-90"
                          style={{ color: COLORS.muted }}
                          aria-label="Entfernen"
                        >
                          <X size={16} strokeWidth={2} />
                        </button>
                      )}
                    </>
                  ) : isPastWeek ? (
                    <span className="flex-1 text-sm py-2" style={{ color: COLORS.mutedLight }}>
                      –
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setPickerDate(key);
                        setPickerSearch('');
                      }}
                      className="flex-1 text-left text-sm font-medium py-2"
                      style={{ color: COLORS.muted }}
                    >
                      + Rezept wählen
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isPastWeek && (
        <button
          onClick={handleCreateShoppingList}
          disabled={assignedInWeek.length === 0}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.primary, boxShadow: '0 4px 16px rgba(38,70,83,0.35)' }}
        >
          <ShoppingCart size={18} strokeWidth={2} />
          Einkaufsliste für die Woche erstellen
        </button>
        )}

      </div>

      {/* Rezept-Auswahl */}
      {pickerDate && (
        // Oben verankert und exakt an den sichtbaren Bereich (ohne Tastatur) angepasst,
        // damit Suchfeld + Ergebnisse nie hinter der Handy-Tastatur verschwinden.
        <div
          className="fixed left-0 right-0 z-40 flex items-start"
          style={{
            top: viewport.offsetTop,
            height: viewport.height,
            backgroundColor: 'rgba(35,40,58,0.4)',
          }}
          onClick={() => setPickerDate(null)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-b-3xl flex flex-col"
            style={{
              backgroundColor: COLORS.bg,
              maxHeight: '100%',
              paddingTop: 'env(safe-area-inset-top)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-lg font-bold"
                  style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Rezept wählen
                </h2>
                <button
                  onClick={() => setPickerDate(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
                  aria-label="Schließen"
                >
                  <X size={18} strokeWidth={2} color={COLORS.ink} />
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Rezept suchen…"
                className="w-full px-4 py-3 rounded-2xl text-sm border-0 outline-none"
                style={{
                  backgroundColor: COLORS.surface,
                  color: COLORS.ink,
                  boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
                }}
              />
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 space-y-2"
              style={{ overscrollBehavior: 'contain' }}
            >
              {filteredPickerRecipes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-center" style={{ color: COLORS.muted }}>
                    Kein Rezept gefunden
                  </p>
                  <button
                    onClick={() => {
                      const date = pickerDate;
                      const suggestedName = pickerSearch.trim();
                      setPickerDate(null);
                      setPickerSearch('');
                      onCreateRecipe(date, suggestedName);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-98"
                    style={{ backgroundColor: COLORS.primary, boxShadow: '0 2px 8px rgba(38,70,83,0.3)' }}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    Rezept hinzufügen
                  </button>
                </div>
              ) : (
                filteredPickerRecipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onAssign(pickerDate, r.id);
                      setPickerDate(null);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all active:scale-98"
                    style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 3px rgba(35,40,58,0.08)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: getCategoryTint(r.category) }}
                    >
                      {r.image_url ? (
                        <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (() => {
                          const RecipeIcon = getRecipeIcon(r.emoji);
                          return <RecipeIcon size={18} strokeWidth={1.75} color={COLORS.primary} />;
                        })()
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: COLORS.ink }}>
                      {r.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
