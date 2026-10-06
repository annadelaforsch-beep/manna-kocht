import { useState } from 'react';
import type { PantryItem } from '../types';
import { COLORS } from '../theme';
import { useVisualViewport } from '../useVisualViewport';
import { X, Plus } from 'lucide-react';

interface Props {
  items: PantryItem[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

/** Verwaltung der "Basics zuhause" – oben verankert, damit die Tastatur nichts verdeckt. */
export default function PantrySheet({ items, onAdd, onRemove, onClose }: Props) {
  const [value, setValue] = useState('');
  const viewport = useVisualViewport();

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-start"
      style={{ top: viewport.offsetTop, height: viewport.height, backgroundColor: 'rgba(35,40,58,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto rounded-b-3xl flex flex-col"
        style={{ backgroundColor: COLORS.bg, maxHeight: '100%', paddingTop: 'env(safe-area-inset-top)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-lg font-bold"
              style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Basics zuhause
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
              aria-label="Schließen"
            >
              <X size={18} strokeWidth={2} color={COLORS.ink} />
            </button>
          </div>
          <p className="text-xs mb-3" style={{ color: COLORS.muted }}>
            Diese Zutaten kommen nicht auf die Einkaufsliste. Der Begriff „Öl“ erfasst auch Olivenöl,
            „Salz“ auch Meersalz.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="z. B. Paprikapulver"
              className="flex-1 px-4 py-3 rounded-2xl text-sm border-0 outline-none"
              style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: '0 1px 4px rgba(35,40,58,0.08)' }}
            />
            <button
              onClick={handleAdd}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: COLORS.primary, boxShadow: '0 2px 8px rgba(38,70,83,0.3)' }}
              aria-label="Hinzufügen"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5" style={{ overscrollBehavior: 'contain' }}>
          {sorted.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: COLORS.muted }}>
              Noch keine Basics eingetragen.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sorted.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm"
                  style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: '0 1px 3px rgba(35,40,58,0.08)' }}
                >
                  {item.name}
                  <button
                    onClick={() => onRemove(item.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full"
                    style={{ color: COLORS.muted }}
                    aria-label={`${item.name} entfernen`}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
