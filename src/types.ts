export interface Recipe {
  id: string;
  name: string;
  category: string;
  time_minutes: number;
  emoji: string;
  image_url?: string | null;
  source_url?: string | null;
  ingredients: string;
  instructions: string;
  macro_veggies: number;
  macro_carbs: number;
  macro_protein: number;
  tip?: string | null;
  created_at?: string;
}

export interface ShoppingItem {
  id: string;
  /** Anzeigetext inkl. Menge, z. B. "300 g Feta" */
  name: string;
  checked: boolean;
  category?: string;
  // --- Felder für das Zusammenführen (fehlen bei älteren Einträgen) ---
  /** normalisierter Vergleichsschlüssel */
  key?: string;
  /** Name ohne Menge, z. B. "Feta" */
  baseName?: string;
  amounts?: { unit: string; amount: number }[];
  /** Quellen (Rezept/Wochenplan-Slot), die bereits eingerechnet sind – verhindert Verdopplung */
  sources?: string[];
  /** wurde bewusst trotz Basics-Liste hinzugefügt */
  forced?: boolean;
}

/** Vorrat zuhause (Salz, Öl, Gewürze …): kommt nicht auf die Einkaufsliste */
export interface PantryItem {
  id: string;
  name: string;
}

/** Zutat, die wegen der Basics-Liste nicht auf der Einkaufsliste gelandet ist */
export interface ExcludedItem {
  id: string;
  key: string;
  name: string;
}

export interface MealPlanEntry {
  id: string;
  plan_date: string; // 'YYYY-MM-DD'
  recipe_id: string;
  /** 0 = Hauptgericht, 1..MAX_EXTRAS = Extras (Beilage/Nachspeise) */
  position: number;
  created_at?: string;
}

export type Screen = 'home' | 'detail' | 'form' | 'shopping' | 'weekplan';

export const CATEGORIES = [
  'Frühstück',
  'Hauptgericht',
  'Kleine Gerichte & Beilagen',
  'Snacks',
  'Fermentation',
  'Süßes',
] as const;

export const FILTER_OPTIONS = [
  'Alle',
  'Favoriten',
  ...CATEGORIES,
] as const;

export type FilterOption = (typeof FILTER_OPTIONS)[number];

/** Maximale Anzahl Extras (Beilage/Nachspeise) zusätzlich zum Hauptgericht pro Tag */
export const MAX_EXTRAS = 2;
