import { useState } from 'react';
import { COLORS, SHADOWS } from '../../theme';
import { RECIPE_ICONS, getRecipeIcon } from '../../icons';

interface Props {
  value: string;
  onChange: (icon: string) => void;
}

/** Zeigt das gewählte Icon; ein Tipp klappt das Raster mit allen Icons auf. */
export default function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const SelectedIcon = getRecipeIcon(value);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transition-transform active:scale-95"
        style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.raised }}
      >
        <SelectedIcon size={28} strokeWidth={1.75} color={COLORS.primary} />
      </button>
      {open && (
        <div
          className="rounded-2xl p-3 grid gap-1"
          style={{
            backgroundColor: COLORS.surface,
            gridTemplateColumns: 'repeat(6, 1fr)',
            boxShadow: '0 4px 16px rgba(35,40,58,0.12)',
          }}
        >
          {RECIPE_ICONS.map((key) => {
            const ItemIcon = getRecipeIcon(key);
            const isSelected = key === value;
            return (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-gray-100 active:scale-90"
                style={{ backgroundColor: isSelected ? COLORS.primaryLight : undefined }}
              >
                <ItemIcon size={18} strokeWidth={1.75} color={COLORS.ink} />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
