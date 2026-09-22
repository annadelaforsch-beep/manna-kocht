import { createClient } from '@supabase/supabase-js';
import type { Recipe } from './types';

const supabaseUrl = 'https://jcjfzzoeceafkysfcgnz.supabase.co';
const supabaseKey = 'sb_publishable_jmEkqN7PoLcqMlgYWn4V3A_8D6R-hrE';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Recipe[];
}

export async function insertRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert([recipe])
    .select()
    .single();
  if (error) throw error;
  return data as Recipe;
}

export async function insertRecipes(recipes: Omit<Recipe, 'id' | 'created_at'>[]): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipes)
    .select();
  if (error) throw error;
  return (data ?? []) as Recipe[];
}

export async function updateRecipe(id: string, recipe: Partial<Omit<Recipe, 'id' | 'created_at'>>): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(recipe)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Recipe;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}
