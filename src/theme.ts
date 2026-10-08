// Zentrale Farb-Tokens, abgeleitet aus der Coolors-Palette
// https://coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51

export const COLORS = {
  // Flächen
  bg: '#FAF6F0', // Seiten-Hintergrund, helles Cream statt dem alten warmen Beige
  surface: '#FFFFFF', // Karten, Inputs, Buttons auf hellem Grund

  // Primärfarbe (dunkles Petrol/Waldgrün, ersetzt das alte #3C6538)
  primary: '#264653',
  primaryDark: '#17262B',
  primaryLight: '#E1EAE9', // sanftes Petrol-Tint für Badges/aktive Zustände

  // Neutral / gedämpfter Text (ersetzt das alte Sandbraun #CAAD82)
  muted: '#7A8F94',
  mutedLight: '#EFEAE1',

  // Standard-Textfarbe
  ink: '#23283A',

  // Funktional
  danger: '#C0392B',
  dangerLight: '#FEE2E2',
  dangerBorder: '#FCA5A5',
  tipBg: '#FEF3D6',
  tipBorder: '#F3D98B',
  tipText: '#7A5B12',

  // Makro-Badges (Gemüse nutzt die Primärfarbe, Carbs/Protein aus der Palette)
  veggieBg: '#E1EAE9',
  veggieText: '#264653',
  carbsBg: '#FBEFD6',
  carbsText: '#B5652E',
  proteinBg: '#F6DAD1',
  proteinText: '#C1503A',

  // Kräftige, gut unterscheidbare Farben für die Makro-Leiste (Petrol / Gelb / Koralle)
  veggieBar: '#264653',
  carbsBar: '#E9C46A',
  proteinBar: '#E76F51',
} as const;

// Akzentfarbe je Kategorie – bewusst dezent eingesetzt (nur für die
// Emoji-Hero-Flächen der Rezeptkarten, nicht für Buttons o.ä.)
export const CATEGORY_ACCENTS: Record<string, string> = {
  'Frühstück': '#E9C46A',
  'Hauptgericht': '#2A9D8F',
  'Kleine Gerichte & Beilagen': '#F4A261',
  'Snacks': '#E76F51',
  'Fermentation': '#264653',
  'Süßes': '#F0B7A4',
};

// Helle Tint-Version je Kategorie für Hintergrundflächen
const CATEGORY_TINTS: Record<string, string> = {
  'Frühstück': '#FBF0D9',
  'Hauptgericht': '#DCEEEB',
  'Kleine Gerichte & Beilagen': '#FDE9DA',
  'Snacks': '#FBE1DA',
  'Fermentation': '#DCE5E7',
  'Süßes': '#FBE7DF',
};

export function getCategoryAccent(category: string): string {
  return CATEGORY_ACCENTS[category] ?? COLORS.primary;
}

export function getCategoryTint(category: string): string {
  return CATEGORY_TINTS[category] ?? COLORS.mutedLight;
}

// Wiederverwendete Schatten (statt überall dieselben Strings zu kopieren)
export const SHADOWS = {
  card: '0 1px 4px rgba(35,40,58,0.08)',
  raised: '0 1px 4px rgba(35,40,58,0.1)',
  soft: '0 1px 3px rgba(35,40,58,0.08)',
  primarySm: '0 2px 8px rgba(38,70,83,0.3)',
  primaryLg: '0 4px 16px rgba(38,70,83,0.35)',
} as const;
