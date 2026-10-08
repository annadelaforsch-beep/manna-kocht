import type { Recipe } from '../../types';
import { COLORS, getCategoryTint } from '../../theme';
import { getRecipeIcon } from '../../icons';

/** Kleine Kachel mit Rezeptfoto oder – ohne Foto – dem gewählten Icon auf Kategoriefarbe. */
export default function RecipeThumb({ recipe }: { recipe: Recipe }) {
  const RecipeIcon = getRecipeIcon(recipe.emoji);
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ backgroundColor: getCategoryTint(recipe.category) }}
    >
      {recipe.image_url ? (
        <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <RecipeIcon size={18} strokeWidth={1.75} color={COLORS.primary} />
      )}
    </div>
  );
}
