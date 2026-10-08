import { useEffect, useState } from 'react';
import type { PantryItem } from '../types';
import { fetchPantry, addPantryItem, removePantryItem, DEFAULT_PANTRY } from '../pantry';
import { addToShoppingState, reconcileWithPantry, type AddGroup, type ShoppingState } from '../ingredients';
import { loadFromStorage, saveToStorage } from '../storage';

/**
 * Einkaufsliste + "Zuhause vorhanden" (lokal pro Gerät) und die Basics-Liste
 * (geteilt über Supabase, lokal gecacht). Beides hängt zusammen: Ändern sich die
 * Basics, wird die Einkaufsliste abgeglichen.
 */
export function useShopping() {
  const [shopping, setShopping] = useState<ShoppingState>(() => ({
    items: loadFromStorage('mk_shopping', []),
    excluded: loadFromStorage('mk_excluded', []),
  }));
  const [pantry, setPantry] = useState<PantryItem[]>(() =>
    loadFromStorage<PantryItem[]>(
      'mk_pantry',
      DEFAULT_PANTRY.map((name, i) => ({ id: `local-default-${i}`, name }))
    )
  );

  useEffect(() => {
    saveToStorage('mk_shopping', shopping.items);
    saveToStorage('mk_excluded', shopping.excluded);
  }, [shopping]);

  useEffect(() => {
    saveToStorage('mk_pantry', pantry);
  }, [pantry]);

  // Basics laden (bei Fehler, z. B. Tabelle fehlt oder offline, bleibt der lokale Stand)
  useEffect(() => {
    let cancelled = false;
    fetchPantry()
      .then((rows) => {
        if (cancelled) return;
        setPantry(rows);
        setShopping((prev) => reconcileWithPantry(prev, rows));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Einkaufsliste ---

  // Mengen/Schreibweisen werden zusammengeführt, Basics herausgefiltert; `source` verhindert
  // doppeltes Einrechnen, wenn derselbe Button mehrfach gedrückt wird.
  const addGroups = (groups: AddGroup[]) => {
    const pantryNames = pantry.map((p) => p.name);
    setShopping((prev) => addToShoppingState(prev, groups, pantryNames));
  };

  /** Manuell getippter Artikel: kein Basics-Filter, bleibt auch bei Abgleichen erhalten. */
  const addManualItem = (name: string) => {
    setShopping((prev) =>
      addToShoppingState(prev, [{ lines: [name] }], [], { applyPantry: false, forced: true })
    );
  };

  const toggleItem = (id: string) =>
    setShopping((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    }));

  const removeItem = (id: string) =>
    setShopping((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));

  const checkAll = () =>
    setShopping((prev) => ({ ...prev, items: prev.items.map((item) => ({ ...item, checked: true })) }));

  const clearList = () => setShopping({ items: [], excluded: [] });

  /** "Doch kaufen": Zutat aus "Zuhause vorhanden" zurück auf die Liste */
  const restoreExcluded = (id: string) =>
    setShopping((prev) => {
      const entry = prev.excluded.find((e) => e.id === id);
      if (!entry) return prev;
      return addToShoppingState(
        { items: prev.items, excluded: prev.excluded.filter((e) => e.id !== id) },
        [{ lines: [entry.name] }],
        [],
        { applyPantry: false, forced: true }
      );
    });

  // --- Basics (Vorrat) ---

  const addPantry = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || pantry.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return;
    const optimistic: PantryItem = { id: `local-${Date.now()}`, name: trimmed };
    const next = [...pantry, optimistic];
    setPantry(next);
    setShopping((prev) => reconcileWithPantry(prev, next));
    try {
      const saved = await addPantryItem(trimmed);
      setPantry((prev) => prev.map((p) => (p.id === optimistic.id ? saved : p)));
    } catch {
      // bleibt lokal gespeichert, falls Supabase nicht erreichbar ist
    }
  };

  const removePantry = async (id: string) => {
    const next = pantry.filter((p) => p.id !== id);
    setPantry(next);
    setShopping((prev) => reconcileWithPantry(prev, next));
    if (id.startsWith('local-')) return;
    try {
      await removePantryItem(id);
    } catch {
      // lokal bereits entfernt
    }
  };

  /** Einzelnen Artikel der Liste als Basic merken (z. B. Paprikapulver) */
  const markAsBasic = (itemId: string) => {
    const item = shopping.items.find((i) => i.id === itemId);
    if (!item) return;
    addPantry((item.baseName ?? item.name).replace(/\([^)]*\)/g, '').trim());
  };

  return {
    items: shopping.items,
    excluded: shopping.excluded,
    pantry,
    addGroups,
    addManualItem,
    toggleItem,
    removeItem,
    checkAll,
    clearList,
    restoreExcluded,
    addPantry,
    removePantry,
    markAsBasic,
  };
}
