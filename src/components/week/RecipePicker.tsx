import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Recipe } from '../../types';
import { COLORS, SHADOWS } from '../../theme';
import { Input } from '../ui/Field';
import TopSheet from '../ui/TopSheet';
import RecipeThumb from './RecipeThumb';

interface Props {
  recipes: Recipe[];
  /** 0 = Hauptgericht, 1.. = Extra (Beilage/Nachspeise) */
  position: number;
  onPick: (recipeId: string) => void;
  /** Kein Treffer: neues Rezept anlegen (mit dem Suchbegriff als Namensvorschlag) */
  onCreate: (suggestedName: string) => void;
  onClose: () => void;
}

const EXTRA_CATEGORIES: readonly string[] = ['Kleine Gerichte & Beilagen', 'Süßes'];

/**
 * Rezeptauswahl für einen Tag. Oben verankert und exakt an den sichtbaren Bereich
 * (ohne Tastatur) angepasst, damit Suchfeld + Ergebnisse nie hinter der Handy-Tastatur
 * verschwinden. Wird nur bei Bedarf eingeblendet, der Zustand startet also immer frisch.
 */
export default function RecipePicker({ recipes, position, onPick, onCreate, onClose }: Props) {
  const [search, setSearch] = useState('');
  // Bei Extras zeigt die Auswahl zuerst nur Beilagen & Süßes; mit "Alle Rezepte" der Rest.
  const [showAll, setShowAll] = useState(false);

  const onlyExtraCategories = position > 0 && !showAll;
  const filtered = recipes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (!onlyExtraCategories || EXTRA_CATEGORIES.includes(r.category))
  );

  return (
    <TopSheet
      title={position > 0 ? 'Beilage / Nachspeise wählen' : 'Rezept wählen'}
      onClose={onClose}
      header={
        <div className="pt-1">
          <Input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rezept suchen…"
            className="w-full"
          />
          {position > 0 && (
            <div className="flex gap-2 mt-3">
              {[
                { all: false, label: 'Beilagen & Süßes' },
                { all: true, label: 'Alle Rezepte' },
              ].map((opt) => {
                const active = showAll === opt.all;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setShowAll(opt.all)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: active ? COLORS.primary : COLORS.surface,
                      color: active ? '#fff' : COLORS.ink,
                      boxShadow: active ? SHADOWS.primarySm : SHADOWS.soft,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-center" style={{ color: COLORS.muted }}>
              Kein Rezept gefunden
            </p>
            <button
              onClick={() => onCreate(search.trim())}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-98"
              style={{ backgroundColor: COLORS.primary, boxShadow: SHADOWS.primarySm }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Rezept hinzufügen
            </button>
          </div>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              className="w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all active:scale-98"
              style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.soft }}
            >
              <RecipeThumb recipe={r} />
              <span className="text-sm font-medium" style={{ color: COLORS.ink }}>
                {r.name}
              </span>
            </button>
          ))
        )}
      </div>
    </TopSheet>
  );
}
