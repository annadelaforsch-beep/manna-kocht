/**
 * Zutaten und Zubereitung sind einfache Texte, eine Zeile pro Eintrag.
 * Eine Zeile wie "## Teig" beginnt einen neuen Abschnitt (z. B. Teig / Sauce / Belag).
 */
export interface TextSection {
  /** null = Zeilen vor der ersten Überschrift */
  title: string | null;
  lines: string[];
}

const HEADING_RE = /^#{1,6}\s*(.*)$/;

export function parseSections(text: string): TextSection[] {
  const sections: TextSection[] = [];
  let current: TextSection = { title: null, lines: [] };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(HEADING_RE);
    if (heading) {
      if (current.title !== null || current.lines.length > 0) sections.push(current);
      current = { title: heading[1].trim().replace(/:$/, '') || null, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title !== null || current.lines.length > 0) sections.push(current);
  return sections;
}
