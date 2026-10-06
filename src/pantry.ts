import { supabase } from './supabase';
import type { PantryItem } from './types';

/** Standard-Basics, falls Supabase nicht erreichbar ist (entspricht dem SQL-Seed). */
export const DEFAULT_PANTRY: string[] = [
  'Salz',
  'Pfeffer',
  'Öl',
  'Essig',
  'Paprikapulver',
  'Oregano',
  'Zimt',
  'Kurkuma',
  'Kreuzkümmel',
  'Curry',
  'Muskat',
];

export async function fetchPantry(): Promise<PantryItem[]> {
  const { data, error } = await supabase.from('pantry_items').select('id, name').order('name');
  if (error) throw error;
  return (data ?? []) as PantryItem[];
}

export async function addPantryItem(name: string): Promise<PantryItem> {
  const { data, error } = await supabase.from('pantry_items').insert({ name }).select('id, name').single();
  if (error) throw error;
  return data as PantryItem;
}

export async function removePantryItem(id: string): Promise<void> {
  const { error } = await supabase.from('pantry_items').delete().eq('id', id);
  if (error) throw error;
}
