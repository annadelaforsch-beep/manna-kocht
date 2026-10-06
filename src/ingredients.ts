import type { ExcludedItem, PantryItem, ShoppingItem } from './types';

/**
 * Regelbasiertes Zusammenführen von Zutaten-Zeilen für die Einkaufsliste:
 *  - erkennt Mengen + Einheiten ("200g", "1,5 kg", "2 EL", "½ Bund", "2-3 Zehen")
 *  - vereinheitlicht Schreibweisen (Tomate/Tomaten, Möhre/Karotte, Knoblauchzehe/Knoblauch …)
 *  - addiert Mengen gleicher Einheit, filtert "Basics" (Vorrat) heraus
 * Alles hier ist reine Logik ohne React/Supabase.
 */

// ---------- Typen ----------

/** unit '' = Stückzahl */
export interface AmountPart {
  unit: string;
  amount: number;
}

export interface ParsedIngredient {
  /** normalisierter Vergleichsschlüssel (Schreibweisen-unabhängig) */
  key: string;
  /** schöner Anzeigename ohne Menge, z. B. "rote Zwiebel" */
  name: string;
  amounts: AmountPart[];
}

// ---------- Einheiten ----------

interface UnitDef {
  pattern: string; // Regex-Alternativen (klein geschrieben)
  canonical: string;
  factor?: number; // Umrechnung in die kanonische Einheit
}

const UNITS: UnitDef[] = [
  { pattern: 'kg|kilo|kilogramm', canonical: 'g', factor: 1000 },
  { pattern: 'g|gr|gramm', canonical: 'g' },
  { pattern: 'l|liter', canonical: 'ml', factor: 1000 },
  { pattern: 'dl', canonical: 'ml', factor: 100 },
  { pattern: 'cl', canonical: 'ml', factor: 10 },
  { pattern: 'ml', canonical: 'ml' },
  { pattern: 'el|esslöffel', canonical: 'EL' },
  { pattern: 'tl|teelöffel', canonical: 'TL' },
  { pattern: 'prisen?', canonical: 'Prise' },
  { pattern: 'handvoll|handvolle', canonical: 'Handvoll' },
  { pattern: 'bunde?|bund', canonical: 'Bund' },
  { pattern: 'dosen?', canonical: 'Dose' },
  { pattern: 'zehen?', canonical: 'Zehe' },
  { pattern: 'packungen?|pck|päckchen|pkg|packung', canonical: 'Packung' },
  { pattern: 'becher', canonical: 'Becher' },
  { pattern: 'scheiben?', canonical: 'Scheibe' },
  { pattern: 'stück|stücke|stk', canonical: '' },
  { pattern: 'msp|messerspitzen?', canonical: 'Msp' },
  { pattern: 'gläser|glas', canonical: 'Glas' },
  { pattern: 'zweige?', canonical: 'Zweig' },
  { pattern: 'stängel', canonical: 'Stängel' },
  { pattern: 'blätter|blatt', canonical: 'Blatt' },
  { pattern: 'köpfe|kopf', canonical: 'Kopf' },
  { pattern: 'stangen?', canonical: 'Stange' },
  { pattern: 'würfel', canonical: 'Würfel' },
];

const UNIT_REGEXES = UNITS.map((u) => ({
  re: new RegExp(`^(?:${u.pattern})(?=$|[\\s.,;:)])\\.?`, 'i'),
  def: u,
}));

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
};

// ---------- Normalisierung ----------

const STOP_TOKENS = new Set([
  'frisch', 'frische', 'frischer', 'frisches', 'frischen',
  'gehackt', 'gehackte', 'gehackter', 'gehacktes', 'gehackten',
  'gewürfelt', 'gewürfelte', 'gewürfelter', 'gewürfelten',
  'geschält', 'geschälte', 'geschälter', 'geschälten',
  'gerieben', 'geriebene', 'geriebener', 'geriebenen',
  'fein', 'feine', 'feiner', 'feinen',
  'bio', 'tk', 'ca', 'etwa', 'etwas', 'evtl', 'optional', 'nach', 'geschmack',
  'groß', 'große', 'großer', 'großen', 'klein', 'kleine', 'kleiner', 'kleinen',
  'mittelgroß', 'mittelgroße', 'mittelgroßer', 'mittelgroßen',
  'reif', 'reife', 'reifer', 'reifen',
]);

/** Synonyme auf Basis des gestemmten Tokens */
const SYNONYMS: Record<string, string> = {
  möhr: 'karott',
  eier: 'ei',
  ei: 'ei',
};

function stemToken(t: string): string {
  if (t.length > 4) {
    if (t.endsWith('en')) return t.slice(0, -2);
    if (t.endsWith('n') || t.endsWith('e') || t.endsWith('s')) return t.slice(0, -1);
  }
  return t;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // Klammern raus
    .replace(/ß/g, 'ss')
    .replace(/[^a-zäöüß0-9]+/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const UMLAUT_FOLD: Record<string, string> = { ä: 'a', ö: 'o', ü: 'u' };

/**
 * Stems der inhaltlich relevanten Tokens (ohne Füllwörter), mit Synonymen.
 * `foldUmlauts` macht Äpfel/Apfel, Nüsse/Nuss usw. vergleichbar – nur für den
 * Zusammenführ-Schlüssel, nicht fürs Basics-Matching (sonst träfe "Öl" auch "Alkohol").
 */
function contentStems(text: string, foldUmlauts = false): string[] {
  return tokenize(text)
    .filter((t) => !STOP_TOKENS.has(t) && !/^\d+$/.test(t))
    .map((t) => {
      const s = stemToken(t);
      const base = SYNONYMS[s] ?? SYNONYMS[t] ?? s;
      return foldUmlauts ? base.replace(/[äöü]/g, (c) => UMLAUT_FOLD[c]) : base;
    });
}

function makeKey(name: string): string {
  return contentStems(name, true).sort().join(' ');
}

// ---------- Parsing ----------

function parseNumber(raw: string): number | null {
  const s = raw.trim();
  if (FRACTIONS[s] !== undefined) return FRACTIONS[s];
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Kommas außerhalb von Klammern als Trenner */
function splitOutsideParens(text: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0) {
      const rest = text.slice(i);
      const m = rest.match(separator);
      if (m && m.index === 0 && m[0].length > 0) {
        parts.push(current);
        current = '';
        i += m[0].length - 1;
        continue;
      }
    }
    current += ch;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const NUMBER_RE = /^(?:ca\.?\s*)?(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?|[½¼¾⅓⅔])\s*/i;

function parseSingle(line: string): ParsedIngredient | null {
  let text = line.trim().replace(/^[-•*]\s*/, '');
  if (!text) return null;

  // "Saft von 1 Zitrone" → "1 Zitrone"
  text = text.replace(/^(saft|schale|abrieb|zeste)\s+(?:von|einer?|einem)\s+/i, '');

  let amounts: AmountPart[] = [];
  const numMatch = text.match(NUMBER_RE);
  let rest = text;

  if (numMatch) {
    rest = text.slice(numMatch[0].length);
    // Bereiche wie "2-3" → oberer Wert
    const rawNum = numMatch[1].split(/[-–]/).pop() as string;
    const amount = parseNumber(rawNum);

    // Einheit direkt dahinter?
    let unit = '';
    let factor = 1;
    for (const { re, def } of UNIT_REGEXES) {
      const m = rest.match(re);
      if (m) {
        unit = def.canonical;
        factor = def.factor ?? 1;
        rest = rest.slice(m[0].length).trim();
        break;
      }
    }
    // Beschreibung nach dem ersten Komma (außerhalb Klammern) entfällt: "Feta, zerbröselt" → "Feta"
    rest = splitOutsideParens(rest, /^,/)[0] ?? rest;
    rest = rest.replace(/^(?:von|an)\s+/i, '').trim();
    if (amount !== null) amounts = [{ unit, amount: amount * factor }];
  }

  let name = rest.trim();
  if (!name) return null;

  // "Knoblauchzehen" → Name "Knoblauch", Einheit Zehe
  const zehe = name.match(/^(.*?)zehen?$/i);
  if (zehe && zehe[1].length >= 3) {
    name = zehe[1];
    if (amounts.length === 1 && amounts[0].unit === '') amounts = [{ unit: 'Zehe', amount: amounts[0].amount }];
  }

  const key = makeKey(name);
  if (!key) return null;
  return { key, name, amounts };
}

/**
 * Zerlegt eine Zutaten-Zeile. Zeilen ohne Menge wie "Salz, Pfeffer" oder
 * "Salz und Pfeffer" werden in einzelne Zutaten aufgetrennt.
 */
export function parseIngredientLine(line: string): ParsedIngredient[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  // "## Teig"-Abschnittsüberschriften sind keine Zutaten
  if (trimmed.startsWith('#')) return [];
  const hasAmount = NUMBER_RE.test(trimmed.replace(/^(saft|schale|abrieb|zeste)\s+(?:von|einer?|einem)\s+/i, ''));
  if (!hasAmount) {
    const parts = splitOutsideParens(trimmed, /^(?:,|\s+und\s+|\s*&\s*|\s*\+\s*)/i);
    return parts.map(parseSingle).filter((p): p is ParsedIngredient => p !== null);
  }
  const single = parseSingle(trimmed);
  return single ? [single] : [];
}

/**
 * Trennt eine Zutaten-Zeile für die Anzeige in Menge ("200 g") und Name ("Feta"),
 * ohne sie inhaltlich zu verändern. Zeilen ohne führende Menge bleiben komplett im Namen.
 */
export function splitAmountAndName(line: string): { amount: string; name: string } {
  const trimmed = line.trim();
  const m = trimmed.match(NUMBER_RE);
  if (!m) return { amount: '', name: trimmed };
  let rest = trimmed.slice(m[0].length);
  let unitText = '';
  for (const { re } of UNIT_REGEXES) {
    const um = rest.match(re);
    if (um) {
      unitText = um[0].replace(/\.$/, '');
      rest = rest.slice(um[0].length).trim();
      break;
    }
  }
  const name = rest.trim();
  if (!name) return { amount: '', name: trimmed };
  const amount = `${m[0].trim()}${unitText ? ` ${unitText}` : ''}`.replace(/\s*[-–]\s*/, '–');
  return { amount, name };
}

// ---------- Mengen & Anzeige ----------

export function mergeAmounts(a: AmountPart[], b: AmountPart[]): AmountPart[] {
  const result = a.map((p) => ({ ...p }));
  for (const part of b) {
    const existing = result.find((p) => p.unit === part.unit);
    if (existing) existing.amount += part.amount;
    else result.push({ ...part });
  }
  return result;
}

const UNIT_PLURALS: Record<string, string> = {
  Zehe: 'Zehen',
  Dose: 'Dosen',
  Packung: 'Packungen',
  Scheibe: 'Scheiben',
  Zweig: 'Zweige',
  Blatt: 'Blätter',
  Kopf: 'Köpfe',
  Stange: 'Stangen',
  Glas: 'Gläser',
  Prise: 'Prisen',
};

function fmtNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = Math.round((rounded - whole) * 100) / 100;
  const symbol = frac === 0.5 ? '½' : frac === 0.25 ? '¼' : frac === 0.75 ? '¾' : null;
  if (symbol) return whole === 0 ? symbol : `${whole}${symbol}`;
  return String(rounded).replace('.', ',');
}

function fmtPart(part: AmountPart): string {
  let { unit, amount } = part;
  if (unit === 'g' && amount >= 1000) {
    unit = 'kg';
    amount /= 1000;
  } else if (unit === 'ml' && amount >= 1000) {
    unit = 'l';
    amount /= 1000;
  }
  if (unit === '') return Number.isInteger(amount) ? `${amount}×` : fmtNumber(amount);
  if (amount > 1 && UNIT_PLURALS[unit]) unit = UNIT_PLURALS[unit];
  return `${fmtNumber(amount)} ${unit}`;
}

/** "300 g Feta", "3× rote Zwiebel", "Olivenöl (3 EL + 200 ml)", ohne Menge nur "Feta" */
export function formatShoppingName(name: string, amounts: AmountPart[]): string {
  if (amounts.length === 0) return name;
  if (amounts.length === 1) return `${fmtPart(amounts[0])} ${name}`;
  return `${name} (${amounts.map(fmtPart).join(' + ')})`;
}

// ---------- Vorrat / Basics ----------

/**
 * Ein Basics-Begriff trifft eine Zutat, wenn jedes Wort des Begriffs einem Wort der
 * Zutat entspricht oder dessen Ende ist ("Öl" trifft "Olivenöl", "Salz" trifft "Meersalz",
 * aber nicht "Salzkartoffeln").
 */
export function matchesPantry(ingredientName: string, pantryTerms: string[]): boolean {
  const ingredientStems = contentStems(ingredientName);
  if (ingredientStems.length === 0) return false;
  return pantryTerms.some((term) => {
    const termStems = contentStems(term);
    if (termStems.length === 0) return false;
    return termStems.every((ts) => ingredientStems.some((is) => is === ts || is.endsWith(ts)));
  });
}

// ---------- Einkaufslisten-Logik ----------

export interface ShoppingState {
  items: ShoppingItem[];
  excluded: ExcludedItem[];
}

export interface AddGroup {
  /** identifiziert die Quelle (z. B. "recipe:ID" oder "week:2026-10-03:2026-10-05:0:ID"), damit erneutes Hinzufügen nichts verdoppelt */
  source?: string;
  lines: string[];
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Strukturierte Daten eines Items; ältere Items (nur `name`) werden nachträglich geparst. */
function describeItem(item: ShoppingItem): { key: string; baseName: string; amounts: AmountPart[] } {
  if (item.key && item.baseName) {
    // Schlüssel immer frisch berechnen, damit ältere Einträge (vor Regel-Verbesserungen)
    // mit neuen zusammengeführt werden.
    return { key: makeKey(item.baseName) || item.key, baseName: item.baseName, amounts: item.amounts ?? [] };
  }
  const parsed = parseIngredientLine(item.name)[0];
  if (parsed) return { key: parsed.key, baseName: parsed.name, amounts: parsed.amounts };
  return { key: makeKey(item.name) || item.name.toLowerCase(), baseName: item.name, amounts: [] };
}

export function addToShoppingState(
  state: ShoppingState,
  groups: AddGroup[],
  pantry: string[],
  options: { applyPantry?: boolean; forced?: boolean } = {}
): ShoppingState {
  const applyPantry = options.applyPantry ?? true;
  const items = state.items.map((i) => ({ ...i }));
  const excluded = state.excluded.map((e) => ({ ...e }));
  const preExisting = new Set(items.map((i) => i.id));

  for (const group of groups) {
    for (const line of group.lines) {
      for (const parsed of parseIngredientLine(line)) {
        if (applyPantry && matchesPantry(parsed.name, pantry)) {
          if (!excluded.some((e) => e.key === parsed.key)) {
            excluded.push({ id: newId(), key: parsed.key, name: parsed.name });
          }
          continue;
        }

        const existing = items.find((i) => !i.checked && describeItem(i).key === parsed.key);
        if (existing) {
          if (group.source && preExisting.has(existing.id) && existing.sources?.includes(group.source)) continue;
          const d = describeItem(existing);
          const amounts = mergeAmounts(d.amounts, parsed.amounts);
          existing.key = d.key;
          existing.baseName = d.baseName;
          existing.amounts = amounts;
          existing.name = formatShoppingName(d.baseName, amounts);
          if (group.source) existing.sources = [...(existing.sources ?? []), group.source];
          if (options.forced) existing.forced = true;
        } else {
          items.push({
            id: newId(),
            name: formatShoppingName(parsed.name, parsed.amounts),
            checked: false,
            key: parsed.key,
            baseName: parsed.name,
            amounts: parsed.amounts,
            sources: group.source ? [group.source] : [],
            ...(options.forced ? { forced: true } : {}),
          });
        }
      }
    }
  }
  return { items, excluded };
}

/**
 * Gleicht die Einkaufsliste nach einer Änderung der Basics-Liste ab:
 * nicht abgehakte Treffer wandern nach "Zuhause vorhanden", Einträge dort,
 * die nicht mehr passen, kommen zurück in die Liste.
 */
export function reconcileWithPantry(state: ShoppingState, pantry: PantryItem[] | string[]): ShoppingState {
  const terms = pantry.map((p) => (typeof p === 'string' ? p : p.name));
  const items: ShoppingItem[] = [];
  const excluded = state.excluded.map((e) => ({ ...e }));

  for (const item of state.items) {
    if (!item.checked && !item.forced) {
      const d = describeItem(item);
      if (matchesPantry(d.baseName, terms)) {
        if (!excluded.some((e) => e.key === d.key)) excluded.push({ id: newId(), key: d.key, name: d.baseName });
        continue;
      }
    }
    items.push(item);
  }

  const stillExcluded: ExcludedItem[] = [];
  const restored: ShoppingItem[] = [];
  for (const e of excluded) {
    if (matchesPantry(e.name, terms)) stillExcluded.push(e);
    else
      restored.push({
        id: newId(),
        name: e.name,
        checked: false,
        key: e.key,
        baseName: e.name,
        amounts: [],
        sources: [],
      });
  }
  return { items: [...items, ...restored], excluded: stillExcluded };
}
