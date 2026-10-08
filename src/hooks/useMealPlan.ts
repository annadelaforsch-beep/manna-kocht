import { useCallback, useEffect, useState } from 'react';
import type { MealPlanEntry } from '../types';
import { fetchMealPlan, setMealPlanEntry, clearMealPlanEntry } from '../mealPlan';

/**
 * Wochenplan (Hauptgericht = position 0, Extras = position 1..).
 * Änderungen werden sofort lokal angezeigt und danach in Supabase gespeichert.
 */
export function useMealPlan() {
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Komplette Historie laden (pro Tag nur ein kleiner Eintrag), damit man in alle
      // vergangenen Wochen zurückblättern kann.
      setEntries(await fetchMealPlan('1970-01-01'));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (planDate: string, recipeId: string, position = 0) => {
    const optimistic: MealPlanEntry = {
      id: `local-${planDate}-${position}`,
      plan_date: planDate,
      recipe_id: recipeId,
      position,
    };
    const isSlot = (e: MealPlanEntry) => e.plan_date === planDate && e.position === position;
    setEntries((prev) => [...prev.filter((e) => !isSlot(e)), optimistic]);
    try {
      const saved = await setMealPlanEntry(planDate, recipeId, position);
      setEntries((prev) => prev.map((e) => (isSlot(e) ? saved : e)));
    } catch {
      // Optimistisches Update bleibt bestehen, auch wenn Supabase nicht erreichbar ist
    }
  };

  // Hauptgericht (position 0) entfernen = ganzen Tag leeren, da Extras immer zu einem Hauptgericht gehören.
  const clear = async (planDate: string, position = 0) => {
    setEntries((prev) =>
      prev.filter((e) => !(e.plan_date === planDate && (position === 0 || e.position === position)))
    );
    try {
      await clearMealPlanEntry(planDate, position === 0 ? undefined : position);
    } catch {
      // lokal ist der Eintrag bereits entfernt
    }
  };

  return { entries, loading, assign, clear };
}
