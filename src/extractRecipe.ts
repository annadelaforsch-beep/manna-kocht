import { supabase } from './supabase';
import type { Recipe } from './types';

export type ExtractedRecipe = Omit<
  Recipe,
  'id' | 'created_at' | 'macro_veggies' | 'macro_carbs' | 'macro_protein'
> & {
  image_url?: string | null;
};

/**
 * Ruft die Supabase Edge Function "extract-recipe" auf, die eine Rezept-Seite
 * lädt und mit Hilfe von Claude in unser Rezept-Format übersetzt.
 */
export async function extractRecipeFromUrl(url: string): Promise<ExtractedRecipe> {
  const { data, error } = await supabase.functions.invoke('extract-recipe', {
    body: { url },
  });

  if (error) {
    throw new Error(error.message ?? 'Rezept konnte nicht übernommen werden.');
  }
  if (!data || data.error) {
    throw new Error(data?.error ?? 'Rezept konnte nicht übernommen werden.');
  }
  return data.recipe as ExtractedRecipe;
}
