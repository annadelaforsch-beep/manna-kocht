import type { Recipe } from '../types';
import { COLORS, getCategoryTint } from '../theme';

interface Props {
  recipe: Recipe;
  isFavorite: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onAddToShoppingList: (items: string[]) => void;
}

export default function RecipeDetail({
  recipe,
  isFavorite,
  onBack,
  onEdit,
  onToggleFavorite,
  onAddToShoppingList,
}: Props) {
  const ingredients = recipe.ingredients
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const steps = recipe.instructions
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Foto oder Emoji-Hero als Fallback */}
      <div
        className="relative h-64 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: getCategoryTint(recipe.category) }}
      >
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-8xl select-none">{recipe.emoji}</span>
        )}

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm text-xl transition-transform active:scale-90"
          aria-label="Zurück"
        >
          ←
        </button>

        {/* Edit + Favorite */}
        <div className="absolute top-12 right-4 flex gap-2">
          <button
            onClick={onToggleFavorite}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm text-xl transition-transform active:scale-90"
            aria-label={isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
          <button
            onClick={onEdit}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm text-base transition-transform active:scale-90"
            aria-label="Bearbeiten"
          >
            ✏️
          </button>
        </div>
      </div>

      {/* Content card */}
      <div
        className="relative -mt-6 rounded-t-3xl px-5 pt-6 pb-32"
        style={{ backgroundColor: COLORS.bg }}
      >
        {/* Name + meta */}
        <h1
          className="text-2xl font-bold mb-2 leading-tight"
          style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {recipe.name}
        </h1>
        <div className="flex items-center gap-3 text-sm mb-5" style={{ color: COLORS.muted }}>
          <span>⏱ {recipe.time_minutes} Min</span>
          <span>·</span>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
          >
            {recipe.category}
          </span>
        </div>

        {/* Macro cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MacroCard
            icon="🥦"
            label="Gemüse"
            value={recipe.macro_veggies}
            bg={COLORS.veggieBg}
            color={COLORS.veggieText}
          />
          <MacroCard
            icon="🌾"
            label="Carbs"
            value={recipe.macro_carbs}
            bg={COLORS.carbsBg}
            color={COLORS.carbsText}
          />
          <MacroCard
            icon="🫘"
            label="Protein"
            value={recipe.macro_protein}
            bg={COLORS.proteinBg}
            color={COLORS.proteinText}
          />
        </div>

        {/* Ingredients */}
        <Section title="Zutaten">
          <ul className="space-y-2">
            {ingredients.map((ingredient, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS.primary }}
                />
                <span className="text-sm" style={{ color: COLORS.ink }}>{ingredient}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Instructions */}
        <Section title="Zubereitung">
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed pt-1" style={{ color: COLORS.ink }}>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* Tip */}
        {recipe.tip && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-start gap-3"
            style={{ backgroundColor: COLORS.tipBg, border: `1px solid ${COLORS.tipBorder}` }}
          >
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm leading-relaxed" style={{ color: COLORS.tipText }}>
              {recipe.tip}
            </p>
          </div>
        )}

        {/* Add to shopping list button */}
        <button
          onClick={() => onAddToShoppingList(ingredients)}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-98"
          style={{
            backgroundColor: COLORS.primary,
            boxShadow: '0 4px 16px rgba(38,70,83,0.35)',
          }}
        >
          🛒 Zutaten zur Einkaufsliste hinzufügen
        </button>
      </div>
    </div>
  );
}

function MacroCard({
  icon,
  label,
  value,
  bg,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  bg: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center text-center"
      style={{ backgroundColor: bg }}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xl font-bold" style={{ color }}>{value}%</span>
      <span className="text-xs font-medium mt-0.5" style={{ color }}>{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2
        className="text-lg font-bold mb-4"
        style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
