import { useCallback, useEffect, useState } from 'react';
import type { Recipe } from '../types';
import { fetchRecipes, insertRecipe, insertRecipes, updateRecipe, deleteRecipe } from '../supabase';
import { DEFAULT_RECIPES } from '../defaults';

export type RecipeInput = Omit<Recipe, 'id' | 'created_at'>;

const localDefaults = (): Recipe[] => DEFAULT_RECIPES.map((r, i) => ({ ...r, id: `local-${i}` }));

/**
 * Rezepte aus Supabase. Ist Supabase nicht erreichbar, arbeitet die App lokal weiter
 * (Beispielrezepte bzw. lokal angelegte Rezepte).
 */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecipes();
      if (data.length > 0) {
        setRecipes(data);
      } else {
        try {
          const seeded = await insertRecipes(DEFAULT_RECIPES);
          setRecipes(seeded.length > 0 ? seeded : localDefaults());
        } catch {
          setRecipes(localDefaults());
        }
      }
    } catch {
      setRecipes(localDefaults());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  /** Legt ein Rezept an und gibt es (mit ID) zurück. */
  const createRecipe = async (data: RecipeInput): Promise<Recipe> => {
    try {
      const created = await insertRecipe(data);
      setRecipes((prev) => [created, ...prev]);
      return created;
    } catch {
      const temp: Recipe = { ...data, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
      setRecipes((prev) => [temp, ...prev]);
      return temp;
    }
  };

  const saveRecipe = async (id: string, data: RecipeInput): Promise<void> => {
    try {
      const updated = await updateRecipe(id, data);
      setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    }
  };

  const removeRecipe = async (id: string): Promise<void> => {
    try {
      await deleteRecipe(id);
    } catch {
      // lokal trotzdem entfernen, auch wenn Supabase nicht erreichbar ist
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  return { recipes, loading, createRecipe, saveRecipe, removeRecipe };
}
