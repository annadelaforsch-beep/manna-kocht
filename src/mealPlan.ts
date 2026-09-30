import { supabase } from './supabase';
import type { MealPlanEntry } from './types';

/**
 * Lädt alle Wochenplan-Einträge ab einem bestimmten Datum (inkl.), aufsteigend
 * sortiert. Wird sowohl für die aktuelle Woche als auch für die Historie genutzt.
 */
export async function fetchMealPlan(sinceDate: string): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from('meal_plan')
    .select('*')
    .gte('plan_date', sinceDate)
    .order('plan_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MealPlanEntry[];
}

/**
 * Setzt (oder überschreibt) das Rezept für einen bestimmten Tag.
 */
export async function setMealPlanEntry(planDate: string, recipeId: string): Promise<MealPlanEntry> {
  const { data, error } = await supabase
    .from('meal_plan')
    .upsert({ plan_date: planDate, recipe_id: recipeId }, { onConflict: 'plan_date' })
    .select()
    .single();

  if (error) throw error;
  return data as MealPlanEntry;
}

/**
 * Entfernt den Eintrag für einen bestimmten Tag wieder.
 */
export async function clearMealPlanEntry(planDate: string): Promise<void> {
  const { error } = await supabase.from('meal_plan').delete().eq('plan_date', planDate);
  if (error) throw error;
}
