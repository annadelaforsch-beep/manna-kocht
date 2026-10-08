import { describe, expect, it } from 'vitest';
import { parseSections } from './recipeText';

describe('parseSections', () => {
  it('gliedert Text an "##"-Überschriften', () => {
    expect(parseSections('## Teig\n500 g Mehl\n1 TL Salz\n\n## Sauce:\n400 g Tomaten')).toEqual([
      { title: 'Teig', lines: ['500 g Mehl', '1 TL Salz'] },
      { title: 'Sauce', lines: ['400 g Tomaten'] },
    ]);
  });

  it('liefert einen Abschnitt ohne Titel, wenn es keine Überschriften gibt', () => {
    expect(parseSections('200g Feta\n1 Zwiebel')).toEqual([{ title: null, lines: ['200g Feta', '1 Zwiebel'] }]);
  });

  it('behält Zeilen vor der ersten Überschrift', () => {
    expect(parseSections('Vorab\n## Teig\nMehl')).toEqual([
      { title: null, lines: ['Vorab'] },
      { title: 'Teig', lines: ['Mehl'] },
    ]);
  });

  it('kommt mit leerem Text und Überschrift ohne Namen klar', () => {
    expect(parseSections('')).toEqual([]);
    expect(parseSections('##\nMehl')).toEqual([{ title: null, lines: ['Mehl'] }]);
  });
});
