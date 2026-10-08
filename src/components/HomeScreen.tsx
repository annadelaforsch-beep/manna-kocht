import { useState } from 'react';
import type { Recipe, FilterOption } from '../types';
import { FILTER_OPTIONS } from '../types';
import { COLORS, getCategoryTint, SHADOWS } from '../theme';
import { getRecipeIcon } from '../icons';
import { Utensils, Heart, Pencil, LeafyGreen, Wheat, Nut } from 'lucide-react';

interface Props {
  recipes: Recipe[];
  favorites: string[];
  loading: boolean;
  onSelectRecipe: (id: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onAddRecipe: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function HomeScreen({
  recipes,
  favorites,
  loading,
  onSelectRecipe,
  onEditRecipe,
  onAddRecipe,
  onToggleFavorite,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('Alle');

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'Alle') return true;
    if (activeFilter === 'Favoriten') return favorites.includes(r.id);
    return r.category === activeFilter;
  });

  return (
    <div className="relative min-h-screen pb-28" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-20 px-5 pt-12 pb-4" style={{ backgroundColor: COLORS.bg }}>
        <div className="flex items-center justify-between mb-4">
          <h1
            className="font-serif text-2xl font-bold"
            style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Manna kocht
          </h1>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
            style={{ backgroundColor: COLORS.primary }}
          >
            M
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke={COLORS.muted} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rezept suchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-2xl text-sm border-0 outline-none"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              boxShadow: SHADOWS.card,
            }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {FILTER_OPTIONS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? COLORS.primary : COLORS.surface,
                  color: active ? '#fff' : COLORS.ink,
                  boxShadow: active ? SHADOWS.primarySm : SHADOWS.soft,
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </header>

      {/* Makro-Hinweis-Banner */}
      <div
        className="mx-5 mb-5 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.card }}
      >
        <Utensils size={20} strokeWidth={2} color={COLORS.primary} className="flex-shrink-0" />
        <div className="text-sm" style={{ color: COLORS.ink }}>
          <span className="font-semibold" style={{ color: COLORS.primary }}>Eat the Rainbow</span>
          <span style={{ color: COLORS.muted }}> &nbsp;·&nbsp; 50% Gemüse &nbsp;·&nbsp; 25% Carbs &nbsp;·&nbsp; 25% Protein</span>
        </div>
      </div>

      {/* Recipe grid */}
      <div className="px-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Utensils size={48} strokeWidth={1.5} color={COLORS.muted} className="mb-4" />
            <p className="text-base font-medium" style={{ color: COLORS.ink }}>Kein Rezept gefunden</p>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>Füge ein neues Rezept hinzu!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={favorites.includes(recipe.id)}
                onSelect={() => onSelectRecipe(recipe.id)}
                onEdit={() => onEditRecipe(recipe)}
                onFavorite={() => onToggleFavorite(recipe.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB: Rezept hinzufügen (nur auf dem Rezepte-Tab) */}
      <button
        onClick={onAddRecipe}
        className="fixed right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-light transition-transform active:scale-95 z-30"
        style={{
          backgroundColor: COLORS.primary,
          boxShadow: '0 4px 16px rgba(38,70,83,0.4)',
          bottom: 'calc(84px + env(safe-area-inset-bottom))',
        }}
        aria-label="Rezept hinzufügen"
      >
        +
      </button>
    </div>
  );
}

function RecipeCard({
  recipe,
  isFavorite,
  onSelect,
  onEdit,
  onFavorite,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onFavorite: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer bg-white transition-transform active:scale-98"
      style={{ boxShadow: '0 2px 12px rgba(35,40,58,0.09)' }}
      onClick={onSelect}
    >
      {/* Foto oder Emoji-Hero als Fallback */}
      <div
        className="relative h-40 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: getCategoryTint(recipe.category) }}
      >
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (() => {
            const RecipeIcon = getRecipeIcon(recipe.emoji);
            return <RecipeIcon size={48} strokeWidth={1.5} color={COLORS.primary} />;
          })()
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className="absolute top-3 right-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform active:scale-90"
          aria-label={isFavorite ? 'Favorit entfernen' : 'Favorit hinzufügen'}
        >
          <Heart
            size={16}
            strokeWidth={2}
            color={COLORS.danger}
            fill={isFavorite ? COLORS.danger : 'none'}
          />
        </button>

        {/* Edit button */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform active:scale-90"
          aria-label="Rezept bearbeiten"
        >
          <Pencil size={14} strokeWidth={2} color={COLORS.ink} />
        </button>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3
          className="font-semibold text-base leading-tight mb-1"
          style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {recipe.name}
        </h3>
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: COLORS.muted }}>
          <span>⏱ {recipe.time_minutes} Min</span>
          <span>·</span>
          <span>{recipe.category}</span>
        </div>

        {/* Macro badges */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: COLORS.veggieBg, color: COLORS.veggieText }}
          >
            <LeafyGreen size={12} strokeWidth={2} />
            {recipe.macro_veggies}%
          </span>
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: COLORS.carbsBg, color: COLORS.carbsText }}
          >
            <Wheat size={12} strokeWidth={2} />
            {recipe.macro_carbs}%
          </span>
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: COLORS.proteinBg, color: COLORS.proteinText }}
          >
            <Nut size={12} strokeWidth={2} />
            {recipe.macro_protein}%
          </span>
        </div>
      </div>
    </div>
  );
}
