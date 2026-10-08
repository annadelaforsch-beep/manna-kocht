import { Plus, X } from 'lucide-react';
import type { MealPlanEntry, Recipe } from '../../types';
import { MAX_EXTRAS } from '../../types';
import { COLORS, getCategoryTint, SHADOWS } from '../../theme';
import { getRecipeIcon } from '../../icons';
import { formatDayLabel, toDateKey, WEEKDAY_LABELS } from '../../weekUtils';
import RecipeThumb from './RecipeThumb';

interface Props {
  date: Date;
  /** Index des Tages in der Woche (0 = Samstag) */
  weekdayIndex: number;
  isToday: boolean;
  /** Vergangene Wochen sind nur lesbar */
  readOnly: boolean;
  /** Einträge dieses Tages, nach Position sortiert */
  entries: MealPlanEntry[];
  recipeById: Map<string, Recipe>;
  onSelectRecipe: (id: string) => void;
  onClear: (planDate: string, position: number) => void;
  onOpenPicker: (planDate: string, position: number) => void;
}

/** Ein Tag im Wochenplan: Hauptgericht plus bis zu MAX_EXTRAS Beilagen/Nachspeisen. */
export default function DayCard({
  date,
  weekdayIndex,
  isToday,
  readOnly,
  entries,
  recipeById,
  onSelectRecipe,
  onClear,
  onOpenPicker,
}: Props) {
  const key = toDateKey(date);
  const mainEntry = entries.find((e) => e.position === 0);
  const recipe = mainEntry ? recipeById.get(mainEntry.recipe_id) : undefined;
  const extras = entries.filter((e) => e.position > 0);
  const freePosition = Array.from({ length: MAX_EXTRAS }, (_, n) => n + 1).find(
    (p) => !extras.some((e) => e.position === p)
  );

  return (
    <div
      className="rounded-2xl p-3"
      style={{
        backgroundColor: COLORS.surface,
        boxShadow: SHADOWS.card,
        border: `2px solid ${isToday ? COLORS.primary : 'transparent'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 flex-shrink-0 text-center">
          <div className="text-xs font-semibold" style={{ color: COLORS.muted }}>
            {WEEKDAY_LABELS[weekdayIndex]}
          </div>
          <div className="text-sm font-bold" style={{ color: COLORS.ink }}>
            {formatDayLabel(date)}
          </div>
        </div>

        {recipe ? (
          <>
            <button
              onClick={() => onSelectRecipe(recipe.id)}
              className="flex-1 flex items-center gap-3 text-left min-w-0"
            >
              <RecipeThumb recipe={recipe} />
              <span className="text-sm font-medium truncate" style={{ color: COLORS.ink }}>
                {recipe.name}
              </span>
            </button>
            {!readOnly && (
              <button
                onClick={() => onClear(key, 0)}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-90"
                style={{ color: COLORS.muted }}
                aria-label="Entfernen"
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </>
        ) : readOnly ? (
          <span className="flex-1 text-sm py-2" style={{ color: COLORS.mutedLight }}>
            –
          </span>
        ) : (
          <button
            onClick={() => onOpenPicker(key, 0)}
            className="flex-1 text-left text-sm font-medium py-2"
            style={{ color: COLORS.muted }}
          >
            + Rezept wählen
          </button>
        )}
      </div>

      {/* Extras (Beilage / Nachspeise) – nur wenn es ein Hauptgericht gibt */}
      {recipe && (extras.length > 0 || (!readOnly && freePosition !== undefined)) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pl-[60px]">
          {extras.map((extra) => {
            const extraRecipe = recipeById.get(extra.recipe_id);
            const ExtraIcon = extraRecipe ? getRecipeIcon(extraRecipe.emoji) : null;
            return (
              <span
                key={extra.id}
                className="inline-flex items-center gap-1 max-w-full rounded-full text-xs font-medium"
                style={{
                  backgroundColor: extraRecipe ? getCategoryTint(extraRecipe.category) : COLORS.mutedLight,
                  color: COLORS.ink,
                  paddingLeft: 8,
                  paddingRight: readOnly ? 8 : 2,
                }}
              >
                <button
                  onClick={() => extraRecipe && onSelectRecipe(extraRecipe.id)}
                  disabled={!extraRecipe}
                  className="inline-flex items-center gap-1 min-w-0 py-1"
                >
                  {ExtraIcon && <ExtraIcon size={12} strokeWidth={2} color={COLORS.primary} />}
                  <span className="truncate">{extraRecipe ? extraRecipe.name : '(gelöschtes Rezept)'}</span>
                </button>
                {!readOnly && (
                  <button
                    onClick={() => onClear(key, extra.position)}
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ color: COLORS.muted }}
                    aria-label="Extra entfernen"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </span>
            );
          })}
          {!readOnly && freePosition !== undefined && (
            <button
              onClick={() => onOpenPicker(key, freePosition)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-transform active:scale-95"
              style={{ backgroundColor: COLORS.bg, color: COLORS.muted }}
              aria-label="Beilage oder Nachspeise hinzufügen"
            >
              <Plus size={12} strokeWidth={2.5} />
              {extras.length === 0 && 'Beilage / Dessert'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
