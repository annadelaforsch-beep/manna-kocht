import { useState } from 'react';
import type { Recipe } from '../types';
import { COLORS, getCategoryTint } from '../theme';
import PrimaryButton from './ui/PrimaryButton';
import { getRecipeIcon } from '../icons';
import { parseSections } from '../recipeText';
import { splitAmountAndName } from '../ingredients';
import { Heart, Pencil, Clock, Lightbulb, ShoppingCart, ArrowUpRight, ArrowLeft, X } from 'lucide-react';

interface Props {
  recipe: Recipe;
  isFavorite: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onAddToShoppingList: (items: string[]) => void;
}

type Tab = 'ingredients' | 'steps';

const LINE = '#ECE6DA';

export default function RecipeDetail({
  recipe,
  isFavorite,
  onBack,
  onEdit,
  onToggleFavorite,
  onAddToShoppingList,
}: Props) {
  const [tab, setTab] = useState<Tab>('ingredients');
  const [showPhoto, setShowPhoto] = useState(false);

  const ingredientSections = parseSections(recipe.ingredients);
  const stepSections = parseSections(recipe.instructions);
  const shoppingLines = recipe.ingredients
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const RecipeIcon = getRecipeIcon(recipe.emoji);
  const circleBtn =
    'w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-transform active:scale-90';

  // Fortlaufende Nummerierung der Schritte über alle Abschnitte hinweg
  let stepCounter = 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Obere Leiste */}
      <div className="flex items-center justify-between px-4 pt-12">
        <button onClick={onBack} className={circleBtn} aria-label="Zurück">
          <ArrowLeft size={20} strokeWidth={2} color={COLORS.ink} />
        </button>
        <div className="flex gap-2">
          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={circleBtn}
              aria-label="Original-Rezept öffnen"
              title="Original-Rezept öffnen"
            >
              <ArrowUpRight size={18} strokeWidth={2} color={COLORS.primary} />
            </a>
          )}
          <button
            onClick={onToggleFavorite}
            className={circleBtn}
            aria-label={isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
          >
            <Heart size={18} strokeWidth={2} color={COLORS.danger} fill={isFavorite ? COLORS.danger : 'none'} />
          </button>
          <button onClick={onEdit} className={circleBtn} aria-label="Bearbeiten">
            <Pencil size={16} strokeWidth={2} color={COLORS.ink} />
          </button>
        </div>
      </div>

      {/* Kompakter Kopf: kleines Foto/Icon, Titel, Meta */}
      <div className="flex items-center gap-3.5 px-5 pt-3">
        <button
          onClick={() => recipe.image_url && setShowPhoto(true)}
          disabled={!recipe.image_url}
          className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: getCategoryTint(recipe.category) }}
          aria-label={recipe.image_url ? 'Foto vergrößern' : undefined}
        >
          {recipe.image_url ? (
            <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <RecipeIcon size={32} strokeWidth={1.5} color={COLORS.primary} />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h1
            className="text-[22px] font-bold leading-tight mb-1.5"
            style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {recipe.name}
          </h1>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs" style={{ color: COLORS.muted }}>
            <span className="flex items-center gap-1">
              <Clock size={13} strokeWidth={2} />
              {recipe.time_minutes} Min
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
            >
              {recipe.category}
            </span>
          </div>
        </div>
      </div>

      {/* Makro-Leiste */}
      <div className="px-5 pt-3">
        <div className="flex gap-[3px] h-2.5">
          <MacroSegment value={recipe.macro_veggies} color={COLORS.veggieBar} first />
          <MacroSegment value={recipe.macro_carbs} color={COLORS.carbsBar} />
          <MacroSegment value={recipe.macro_protein} color={COLORS.proteinBar} last />
        </div>
        <div className="flex gap-3 mt-1.5 text-[11px]" style={{ color: COLORS.muted }}>
          <Legend color={COLORS.veggieBar} label="Gemüse" value={recipe.macro_veggies} />
          <Legend color={COLORS.carbsBar} label="Carbs" value={recipe.macro_carbs} />
          <Legend color={COLORS.proteinBar} label="Protein" value={recipe.macro_protein} />
        </div>
      </div>

      {/* Tabs (bleiben beim Scrollen oben) */}
      <div
        className="sticky top-0 z-10 px-5 pt-2 pb-2"
        style={{ backgroundColor: COLORS.bg, paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <div className="flex p-[3px] rounded-2xl" style={{ backgroundColor: COLORS.mutedLight }} role="tablist">
          {(
            [
              { key: 'ingredients', label: 'Zutaten' },
              { key: 'steps', label: 'Zubereitung' },
            ] as { key: Tab; label: string }[]
          ).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: active ? COLORS.surface : 'transparent',
                  color: active ? COLORS.primary : COLORS.muted,
                  boxShadow: active ? '0 1px 3px rgba(35,40,58,0.12)' : 'none',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-32">
        {tab === 'ingredients' ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'fit-content(7.5rem) 1fr' }}>
              {ingredientSections.map((section, si) => (
                <div key={si} style={{ display: 'contents' }}>
                  {section.title && <SectionHeading title={section.title} span />}
                  {section.lines.map((line, li) => {
                    const { amount, name } = splitAmountAndName(line);
                    return (
                      <div key={li} style={{ display: 'contents' }}>
                        <div
                          className="py-2 pr-3 text-right text-sm tabular-nums"
                          style={{ borderBottom: `1px solid ${LINE}`, color: COLORS.muted }}
                        >
                          {amount}
                        </div>
                        <div
                          className="py-2 text-sm"
                          style={{ borderBottom: `1px solid ${LINE}`, color: COLORS.ink }}
                        >
                          {name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <PrimaryButton onClick={() => onAddToShoppingList(shoppingLines)} className="mt-6">
              <ShoppingCart size={18} strokeWidth={2} />
              Zutaten zur Einkaufsliste hinzufügen
            </PrimaryButton>
          </>
        ) : (
          <>
            <div>
              {stepSections.map((section, si) => (
                <div key={si}>
                  {section.title && <SectionHeading title={section.title} />}
                  {section.lines.map((line, li) => {
                    stepCounter += 1;
                    return (
                      <div
                        key={li}
                        className="grid py-2.5"
                        style={{ gridTemplateColumns: '24px 1fr', borderBottom: `1px solid ${LINE}` }}
                      >
                        <span className="text-xs pt-[3px] tabular-nums" style={{ color: COLORS.muted }}>
                          {stepCounter}
                        </span>
                        <span className="text-sm leading-relaxed" style={{ color: COLORS.ink }}>
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {recipe.tip && (
              <div
                className="rounded-2xl p-4 mt-6 flex items-start gap-3"
                style={{ backgroundColor: COLORS.tipBg, border: `1px solid ${COLORS.tipBorder}` }}
              >
                <Lightbulb size={20} strokeWidth={2} color={COLORS.tipText} className="flex-shrink-0" />
                <p className="text-sm leading-relaxed" style={{ color: COLORS.tipText }}>
                  {recipe.tip}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Foto groß */}
      {showPhoto && recipe.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,20,28,0.9)' }}
          onClick={() => setShowPhoto(false)}
        >
          <img src={recipe.image_url} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button
            className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
            aria-label="Schließen"
            onClick={() => setShowPhoto(false)}
          >
            <X size={20} strokeWidth={2} color={COLORS.ink} />
          </button>
        </div>
      )}
    </div>
  );
}

function MacroSegment({
  value,
  color,
  first = false,
  last = false,
}: {
  value: number;
  color: string;
  first?: boolean;
  last?: boolean;
}) {
  // Ein Wert von 0 bekommt keinen Balken
  if (value <= 0) return null;
  return (
    <div
      style={{
        flexGrow: value,
        flexBasis: 0,
        backgroundColor: color,
        borderRadius: `${first ? 99 : 3}px ${last ? 99 : 3}px ${last ? 99 : 3}px ${first ? 99 : 3}px`,
      }}
    />
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
      <b style={{ color: COLORS.ink }}>{value}%</b>
    </span>
  );
}

function SectionHeading({ title, span = false }: { title: string; span?: boolean }) {
  return (
    <h3
      className={`text-[11px] font-bold uppercase tracking-wider pt-4 pb-1.5 ${span ? 'col-span-2' : ''}`}
      style={{ color: COLORS.muted }}
    >
      {title}
    </h3>
  );
}
