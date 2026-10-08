import { describe, expect, it } from 'vitest';
import {
  addToShoppingState,
  formatShoppingName,
  matchesPantry,
  mergeAmounts,
  parseIngredientLine,
  reconcileWithPantry,
  splitAmountAndName,
  type ShoppingState,
} from './ingredients';

const empty: ShoppingState = { items: [], excluded: [] };
const names = (s: ShoppingState) => s.items.map((i) => i.name);

describe('parseIngredientLine', () => {
  it('erkennt Menge und Einheit', () => {
    expect(parseIngredientLine('200g Feta')[0]).toMatchObject({ name: 'Feta', amounts: [{ unit: 'g', amount: 200 }] });
    expect(parseIngredientLine('1,5 kg Kartoffeln')[0].amounts).toEqual([{ unit: 'g', amount: 1500 }]);
    expect(parseIngredientLine('250 ml Milch')[0].amounts).toEqual([{ unit: 'ml', amount: 250 }]);
    expect(parseIngredientLine('3 EL Olivenöl')[0].amounts).toEqual([{ unit: 'EL', amount: 3 }]);
  });

  it('versteht Brüche und Bereiche', () => {
    expect(parseIngredientLine('½ Bund Petersilie')[0].amounts).toEqual([{ unit: 'Bund', amount: 0.5 }]);
    expect(parseIngredientLine('1/2 Gurke')[0].amounts).toEqual([{ unit: '', amount: 0.5 }]);
    expect(parseIngredientLine('2-3 Möhren')[0].amounts).toEqual([{ unit: '', amount: 3 }]);
  });

  it('wandelt Knoblauchzehen und "Saft von" um', () => {
    expect(parseIngredientLine('2 Knoblauchzehen')[0]).toMatchObject({ name: 'Knoblauch', amounts: [{ unit: 'Zehe', amount: 2 }] });
    expect(parseIngredientLine('Saft von 1 Zitrone')[0]).toMatchObject({ name: 'Zitrone', amounts: [{ unit: '', amount: 1 }] });
  });

  it('trennt Zeilen ohne Menge an Komma und "und"', () => {
    expect(parseIngredientLine('Salz und Pfeffer').map((p) => p.name)).toEqual(['Salz', 'Pfeffer']);
    expect(parseIngredientLine('Salz, Pfeffer, Paprikapulver').map((p) => p.name)).toEqual(['Salz', 'Pfeffer', 'Paprikapulver']);
  });

  it('lässt "oder"-Alternativen zusammen', () => {
    expect(parseIngredientLine('Frischer Dill oder Petersilie')).toHaveLength(1);
  });

  it('ignoriert Abschnittsüberschriften und leere Zeilen', () => {
    expect(parseIngredientLine('## Teig')).toEqual([]);
    expect(parseIngredientLine('##Sauce')).toEqual([]);
    expect(parseIngredientLine('   ')).toEqual([]);
  });

  it('vereinheitlicht Schreibweisen im Schlüssel', () => {
    const key = (l: string) => parseIngredientLine(l)[0].key;
    expect(key('2 Tomaten')).toBe(key('1 Tomate'));
    expect(key('2 Möhren')).toBe(key('1 Karotte'));
    expect(key('3 Äpfel')).toBe(key('1 Apfel'));
    expect(key('100 g Nüsse')).toBe(key('50 g Nuss'));
    expect(key('2 Eier')).toBe(key('1 Ei'));
    expect(key('2 Knoblauchzehen')).toBe(key('1 Zehe Knoblauch'));
    expect(key('200 g Feta')).not.toBe(key('200 g Mozzarella'));
    expect(key('1 rote Zwiebel')).not.toBe(key('1 Zwiebel'));
  });
});

describe('splitAmountAndName', () => {
  it('trennt Menge und Namen für die Anzeige', () => {
    expect(splitAmountAndName('200g Feta')).toEqual({ amount: '200 g', name: 'Feta' });
    expect(splitAmountAndName('½ Würfel Hefe')).toEqual({ amount: '½ Würfel', name: 'Hefe' });
    expect(splitAmountAndName('2-3 Möhren')).toEqual({ amount: '2–3', name: 'Möhren' });
    expect(splitAmountAndName('Salz und Pfeffer')).toEqual({ amount: '', name: 'Salz und Pfeffer' });
  });
});

describe('Mengen', () => {
  it('addiert gleiche Einheiten und behält verschiedene getrennt', () => {
    expect(mergeAmounts([{ unit: 'g', amount: 200 }], [{ unit: 'g', amount: 100 }])).toEqual([{ unit: 'g', amount: 300 }]);
    expect(mergeAmounts([{ unit: 'EL', amount: 3 }], [{ unit: 'ml', amount: 200 }])).toHaveLength(2);
  });

  it('formatiert lesbar', () => {
    expect(formatShoppingName('Feta', [{ unit: 'g', amount: 300 }])).toBe('300 g Feta');
    expect(formatShoppingName('Kartoffeln', [{ unit: 'g', amount: 1500 }])).toBe('1½ kg Kartoffeln');
    expect(formatShoppingName('Zwiebel', [{ unit: '', amount: 3 }])).toBe('3× Zwiebel');
    expect(formatShoppingName('Gurke', [{ unit: '', amount: 0.5 }])).toBe('½ Gurke');
    expect(formatShoppingName('Knoblauch', [{ unit: 'Zehe', amount: 3 }])).toBe('3 Zehen Knoblauch');
    expect(formatShoppingName('Olivenöl', [{ unit: 'EL', amount: 3 }, { unit: 'ml', amount: 200 }])).toBe('Olivenöl (3 EL + 200 ml)');
    expect(formatShoppingName('Basilikum', [])).toBe('Basilikum');
  });
});

describe('matchesPantry', () => {
  const pantry = ['Salz', 'Pfeffer', 'Öl', 'Essig'];
  it('trifft Zusammensetzungen am Wortende', () => {
    expect(matchesPantry('Olivenöl', pantry)).toBe(true);
    expect(matchesPantry('Meersalz', pantry)).toBe(true);
    expect(matchesPantry('Balsamicoessig', pantry)).toBe(true);
  });
  it('trifft keine Wörter, die nur beginnen oder enthalten', () => {
    expect(matchesPantry('Salzkartoffeln', pantry)).toBe(false);
    expect(matchesPantry('Alkohol', pantry)).toBe(false);
    expect(matchesPantry('Zwiebel', pantry)).toBe(false);
  });
  it('unterstützt mehrteilige Begriffe', () => {
    expect(matchesPantry('Rote Chiliflocken', ['Chiliflocken'])).toBe(true);
    expect(matchesPantry('Chilischote', ['Chiliflocken'])).toBe(false);
  });
});

describe('addToShoppingState', () => {
  const pantry = ['Salz', 'Pfeffer', 'Öl'];

  it('führt gleiche Zutaten aus mehreren Zeilen zusammen', () => {
    const s = addToShoppingState(empty, [{ lines: ['200g Feta', '100 g Feta', '3 Äpfel', '2 Apfel'] }], []);
    expect(names(s)).toEqual(['300 g Feta', '5× Äpfel']);
  });

  it('filtert Basics heraus und merkt sie unter "excluded"', () => {
    const s = addToShoppingState(empty, [{ lines: ['3 EL Olivenöl', 'Salz und Pfeffer', '1 Zwiebel'] }], pantry);
    expect(names(s)).toEqual(['1× Zwiebel']);
    expect(s.excluded.map((e) => e.name).sort()).toEqual(['Olivenöl', 'Pfeffer', 'Salz']);
  });

  it('filtert nichts, wenn applyPantry aus ist', () => {
    const s = addToShoppingState(empty, [{ lines: ['Salz'] }], pantry, { applyPantry: false });
    expect(names(s)).toEqual(['Salz']);
  });

  it('rechnet dieselbe Quelle nur einmal ein', () => {
    const once = addToShoppingState(empty, [{ source: 'recipe:1', lines: ['200 g Feta', '1 Zwiebel'] }], []);
    const twice = addToShoppingState(once, [{ source: 'recipe:1', lines: ['200 g Feta', '1 Zwiebel'] }], []);
    expect(names(twice)).toEqual(names(once));
  });

  it('rechnet neue Quellen auf bestehende Einträge auf', () => {
    const a = addToShoppingState(empty, [{ source: 'recipe:1', lines: ['200 g Feta'] }], []);
    const b = addToShoppingState(a, [{ source: 'recipe:2', lines: ['100 g Feta'] }], []);
    expect(names(b)).toEqual(['300 g Feta']);
  });

  it('legt abgehakte Einträge nicht erneut zusammen, sondern neu an', () => {
    const a = addToShoppingState(empty, [{ lines: ['200 g Feta'] }], []);
    a.items[0].checked = true;
    const b = addToShoppingState(a, [{ lines: ['100 g Feta'] }], []);
    expect(b.items).toHaveLength(2);
  });

  it('führt ältere Einträge ohne Schlüssel mit neuen zusammen', () => {
    const legacy: ShoppingState = {
      items: [{ id: '1', name: '3× Äpfel', checked: false, key: 'äpfel', baseName: 'Äpfel', amounts: [{ unit: '', amount: 3 }] }],
      excluded: [],
    };
    expect(names(addToShoppingState(legacy, [{ lines: ['2 Apfel'] }], []))).toEqual(['5× Äpfel']);
    const plain: ShoppingState = { items: [{ id: '2', name: '200g Feta', checked: false }], excluded: [] };
    expect(names(addToShoppingState(plain, [{ lines: ['100 g Feta'] }], []))).toEqual(['300 g Feta']);
  });
});

describe('reconcileWithPantry', () => {
  it('verschiebt neue Basics aus der Liste und holt entfernte zurück', () => {
    const s = addToShoppingState(empty, [{ lines: ['1 Zwiebel', '200 g Feta'] }], []);
    const moved = reconcileWithPantry(s, ['Zwiebel']);
    expect(names(moved)).toEqual(['200 g Feta']);
    expect(moved.excluded.map((e) => e.name)).toEqual(['Zwiebel']);
    const back = reconcileWithPantry(moved, []);
    expect(back.items.map((i) => i.baseName).sort()).toEqual(['Feta', 'Zwiebel']);
    expect(back.excluded).toEqual([]);
  });

  it('lässt bewusst hinzugefügte (forced) und abgehakte Einträge in Ruhe', () => {
    const s = addToShoppingState(empty, [{ lines: ['Salz'] }], [], { applyPantry: false, forced: true });
    expect(reconcileWithPantry(s, ['Salz']).items).toHaveLength(1);
    const checked = addToShoppingState(empty, [{ lines: ['Salz'] }], []);
    checked.items[0].checked = true;
    expect(reconcileWithPantry(checked, ['Salz']).items).toHaveLength(1);
  });
});
