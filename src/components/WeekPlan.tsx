import { useMemo, useState } from 'react';
import type { MealPlanEntry, Recipe } from '../types';
import { COLORS, getCategoryTint } from '../theme';

interface Props {
  recipes: Recipe[];
  entries: MealPlanEntry[];
  loading: boolean;
  onBack: () => void;
  onAssign: (planDate: string, recipeId: string) => void;
  onClear: (planDate: string) => void;
  onAddWeekToShoppingList: (ingredientLines: string[]) => void;
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
  onBack,
  onAssign,
  onClear,
  onAddWeekToShoppingList,
  onSelectRecipe,
}: Props) {
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const todayKey = toDateKey(new Date());
  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );
  const weekStartKey = toDateKey(weekStart);

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

  // Vergangene Einträge nach Wochen gruppieren (jede Gruppe beginnt an einem Samstag)
  const pastWeeks = useMemo(() => {
    const groups = new Map<string, MealPlanEntry[]>();
    for (const e of entries) {
      if (e.plan_date >= weekStartKey) continue;
      const d = new Date(`${e.plan_date}T00:00:00`);
      const groupKey = toDateKey(getWeekStart(d));
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(e);
    }
    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // neueste Woche zuerst
      .map(([groupKey, weekEntries]) => ({
        weekStartKey: groupKey,
        entries: weekEntries.sort((a, b) => (a.plan_date < b.plan_date ? -1 : 1)),
      }));
  }, [entries, weekStartKey]);

  const assignedThisWeek = weekDates
    .map((d) => entryByDate.get(toDateKey(d)))
    .filter((e): e is MealPlanEntry => Boolean(e));

  const handleCreateShoppingList = () => {
    const lines: string[] = [];
    for (const entry of assignedThisWeek) {
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
        className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ backgroundColor: COLORS.bg }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
          aria-label="Zurück"
        >
          ←
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Wochenplan
        </h1>
      </div>

      <div className="px-5 space-y-3">
        <p className="text-sm" style={{ color: COLORS.muted }}>
          {formatDayLabel(weekDates[0])} – {formatDayLabel(weekDates[6])}
        </p>

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
                            <span className="text-lg">{recipe.emoji}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: COLORS.ink }}>
                          {recipe.name}
                        </span>
                      </button>
                      <button
                        onClick={() => onClear(key)}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-sm transition-transform active:scale-90"
                        style={{ color: COLORS.muted }}
                        aria-label="Entfernen"
                      >
                        ✕
                      </button>
                    </>
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

        <button
          onClick={handleCreateShoppingList}
          disabled={assignedThisWeek.length === 0}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-98 disabled:opacity-40"
          style={{ backgroundColor: COLORS.primary, boxShadow: '0 4px 16px rgba(38,70,83,0.35)' }}
        >
          🛒 Einkaufsliste für die Woche erstellen
        </button>

        {/* Historie */}
        {pastWeeks.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-sm font-semibold"
              style={{ color: COLORS.primary }}
            >
              {showHistory ? '▾' : '▸'} Frühere Wochen
            </button>
            {showHistory && (
              <div className="mt-3 space-y-4">
                {pastWeeks.map(({ weekStartKey: ws, entries: weekEntries }) => {
                  const start = new Date(`${ws}T00:00:00`);
                  const end = new Date(start);
                  end.setDate(start.getDate() + 6);
                  return (
                    <div
                      key={ws}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.08)' }}
                    >
                      <p className="text-xs font-semibold mb-2" style={{ color: COLORS.muted }}>
                        {formatDayLabel(start)} – {formatDayLabel(end)}
                      </p>
                      <div className="space-y-1.5">
                        {weekEntries.map((e) => {
                          const recipe = recipeById.get(e.recipe_id);
                          const d = new Date(`${e.plan_date}T00:00:00`);
                          return (
                            <button
                              key={e.id}
                              onClick={() => recipe && onSelectRecipe(recipe.id)}
                              disabled={!recipe}
                              className="w-full flex items-center gap-2 text-left text-sm"
                            >
                              <span className="w-10 flex-shrink-0 text-xs" style={{ color: COLORS.muted }}>
                                {formatDayLabel(d)}
                              </span>
                              <span style={{ color: COLORS.ink }}>
                                {recipe ? `${recipe.emoji} ${recipe.name}` : '(gelöschtes Rezept)'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rezept-Auswahl */}
      {pickerDate && (
        <div
          className="fixed inset-0 z-30 flex items-end"
          style={{ backgroundColor: 'rgba(35,40,58,0.4)' }}
          onClick={() => setPickerDate(null)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
            style={{ backgroundColor: COLORS.bg, maxHeight: '75vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 pb-3">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: COLORS.mutedLight }} />
              <h2
                className="text-lg font-bold mb-3"
                style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Rezept wählen
              </h2>
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
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
              {filteredPickerRecipes.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: COLORS.muted }}>
                  Kein Rezept gefunden
                </p>
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
                        <span className="text-lg">{r.emoji}</span>
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
