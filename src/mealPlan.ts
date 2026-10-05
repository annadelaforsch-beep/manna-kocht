import { supabase } from './supabase';
import type { MealPlanEntry } from './types';

/**
 * Lädt alle Wochenplan-Einträge ab einem bestimmten Datum (inkl.), absteigend
 * sortiert (neueste zuerst, damit bei sehr langer Historie nie die aktuellen Einträge abgeschnitten werden). Wird sowohl für die aktuelle Woche als auch für die Historie genutzt.
 */
export async function fetchMealPlan(sinceDate: string): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from('meal_plan')
    .select('*')
    .gte('plan_date', sinceDate)
    .order('plan_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MealPlanEntry[];
}

/**
 * Setzt (oder überschreibt) das Rezept für einen Tag und eine Position
 * (0 = Hauptgericht, 1.. = Extras wie Beilage/Nachspeise).
 */
export async function setMealPlanEntry(
  planDate: string,
  recipeId: string,
  position = 0
): Promise<MealPlanEntry> {
  const { data, error } = await supabase
    .from('meal_plan')
    .upsert(
      { plan_date: planDate, recipe_id: recipeId, position },
      { onConflict: 'plan_date,position' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as MealPlanEntry;
}

/**
 * Entfernt einen Eintrag. Ohne `position` wird der ganze Tag geleert
 * (Hauptgericht + Extras), mit `position` nur dieser eine Eintrag.
 */
export async function clearMealPlanEntry(planDate: string, position?: number): Promise<void> {
  let query = supabase.from('meal_plan').delete().eq('plan_date', planDate);
  if (position !== undefined) query = query.eq('position', position);
  const { error } = await query;
  if (error) throw error;
}
