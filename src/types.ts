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
  name: string;
  checked: boolean;
  category?: string;
}

export interface MealPlanEntry {
  id: string;
  plan_date: string; // 'YYYY-MM-DD'
  recipe_id: string;
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

export const FOOD_EMOJIS = [
  '🥣','🥗','🐟','🥩','🍳','🥞','🍜','🍝','🥘','🫕',
  '🥧','🍰','🎂','🍩','🍪','🥐','🥨','🧀','🥚','🧆',
  '🌮','🌯','🥙','🧇','🥓','🥪','🍱','🍛','🍲','🫔',
  '🥦','🥕','🥑','🍋','🍓','🫐','🍇','🍒','🍑','🫙',
  '🍽️','🥄','🍴','🧂','🫚','🥜','🌾','🥬','🍅','🧅',
];
