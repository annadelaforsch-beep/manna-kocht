import { createClient } from '@supabase/supabase-js';
import type { Recipe } from './types';

const supabaseUrl = 'https://jtamkmnlfhczkwstywvj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YW1rbW5sZmhjemt3c3R5d3ZqIiwicm9sZWiOiJhbm9uIiwiaWF0IjoxNzg2MTA3MzM0LCJleHAiOjIxMDE2ODMzMzR9.T3o6jbU-NyATkxjbdknAJAe-QraEpazeMTF8J5Caqsg';

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
