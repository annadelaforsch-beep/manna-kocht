import { useState } from 'react';
import { ArrowRight, Check, Link2 } from 'lucide-react';
import { extractRecipeFromUrl, type ExtractedRecipe } from '../../extractRecipe';
import { COLORS, SHADOWS } from '../../theme';
import { Input } from '../ui/Field';

interface Props {
  /** Wird mit dem übernommenen Rezept und der Quell-URL aufgerufen */
  onImported: (recipe: ExtractedRecipe, sourceUrl: string) => void;
}

/** Rezept per Link von einer Website übernehmen (Claude liest die Seite über eine Edge Function). */
export default function LinkImport({ onImported }: Props) {
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Bitte einen Link einfügen.');
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      onImported(await extractRecipeFromUrl(trimmed), trimmed);
      setImported(true);
    } catch (err) {
      setImported(false);
      setError(err instanceof Error ? err.message : 'Rezept konnte nicht übernommen werden.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.card }}
    >
      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.ink }}>
        <Link2 size={16} strokeWidth={2} />
        Rezept von einer Website übernehmen
      </label>
      <div className="flex gap-2">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="flex-1"
          style={{ backgroundColor: COLORS.bg, boxShadow: 'none' }}
        />
        <button
          onClick={handleExtract}
          disabled={extracting}
          aria-label="Übernehmen"
          title="Übernehmen"
          className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-white transition-all active:scale-98 disabled:opacity-60"
          style={{ backgroundColor: COLORS.primary }}
        >
          {extracting ? <span className="text-sm">…</span> : <ArrowRight size={18} strokeWidth={2.5} />}
        </button>
      </div>
      {error && <p className="text-sm" style={{ color: COLORS.danger }}>{error}</p>}
      {imported && !error && (
        <p className="flex items-start gap-1.5 text-sm" style={{ color: COLORS.primary }}>
          <Check size={16} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
          Übernommen – bitte unten prüfen und bei Bedarf anpassen (Makros bitte selbst setzen).
        </p>
      )}
      <p className="text-xs" style={{ color: COLORS.muted }}>
        Oder einfach unten manuell ausfüllen.
      </p>
    </div>
  );
}
