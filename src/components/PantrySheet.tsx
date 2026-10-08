import { useState } from 'react';
import type { PantryItem } from '../types';
import { COLORS, SHADOWS } from '../theme';
import TopSheet from './ui/TopSheet';
import { Input } from './ui/Field';
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

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <TopSheet
      title="Basics zuhause"
      onClose={onClose}
      header={
        <>
          <p className="text-xs mb-3" style={{ color: COLORS.muted }}>
            Diese Zutaten kommen nicht auf die Einkaufsliste. Der Begriff „Öl“ erfasst auch Olivenöl,
            „Salz“ auch Meersalz.
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="z. B. Paprikapulver"
              className="flex-1"
            />
            <button
              onClick={handleAdd}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: COLORS.primary, boxShadow: SHADOWS.primarySm }}
              aria-label="Hinzufügen"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </>
      }
    >
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
              style={{ backgroundColor: COLORS.surface, color: COLORS.ink, boxShadow: SHADOWS.soft }}
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
    </TopSheet>
  );
}
