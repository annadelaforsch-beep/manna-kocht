import { useState } from 'react';
import type { ShoppingItem } from '../types';
import { COLORS } from '../theme';

interface Props {
  items: ShoppingItem[];
  onBack: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (name: string) => void;
  onCheckAll: () => void;
  onClear: () => void;
}

export default function ShoppingList({ items, onBack, onToggle, onRemove, onAdd, onCheckAll, onClear }: Props) {
  const [newItem, setNewItem] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewItem('');
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const checkedCount = checked.length;
  const total = items.length;

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 pt-12 pb-4"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: COLORS.surface, boxShadow: '0 1px 4px rgba(35,40,58,0.1)' }}
              aria-label="Zurück"
            >
              ←
            </button>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Einkaufsliste
              </h1>
              {total > 0 && (
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  {checkedCount} von {total} erledigt
                </p>
              )}
            </div>
          </div>

          {/* Progress ring */}
          {total > 0 && (
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke={COLORS.mutedLight} strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={COLORS.primary}
                  strokeWidth="3"
                  strokeDasharray={`${(checkedCount / total) * 94.2} 94.2`}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{ color: COLORS.primary }}
              >
                {Math.round((checkedCount / total) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Add item input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Artikel hinzufügen…"
            className="flex-1 px-4 py-3 rounded-2xl text-sm border-0 outline-none"
            style={{
              backgroundColor: COLORS.surface,
              color: COLORS.ink,
              boxShadow: '0 1px 4px rgba(35,40,58,0.08)',
            }}
          />
          <button
            onClick={handleAdd}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-light flex-shrink-0"
            style={{ backgroundColor: COLORS.primary, boxShadow: '0 2px 8px rgba(38,70,83,0.3)' }}
            aria-label="Hinzufügen"
          >
            +
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="px-5 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🛒</span>
            <p className="text-base font-medium" style={{ color: COLORS.ink }}>Die Liste ist leer</p>
            <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
              Füge Artikel hinzu oder öffne ein Rezept
            </p>
          </div>
        ) : (
          <>
            {/* Unchecked items */}
            {unchecked.length > 0 && (
              <div>
                <div className="space-y-2">
                  {unchecked.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => onToggle(item.id)}
                      onRemove={() => onRemove(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Checked items */}
            {checked.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 mt-4" style={{ color: COLORS.muted }}>
                  ✓ Bereits im Korb ({checked.length})
                </p>
                <div className="space-y-2">
                  {checked.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => onToggle(item.id)}
                      onRemove={() => onRemove(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 space-y-2">
              {unchecked.length > 0 && (
                <button
                  onClick={onCheckAll}
                  className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-98"
                  style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
                >
                  ✓ Alle abhaken
                </button>
              )}

              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-98"
                  style={{ backgroundColor: COLORS.dangerLight, color: COLORS.danger }}
                >
                  🗑 Liste leeren
                </button>
              ) : (
                <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.dangerLight }}>
                  <p className="text-sm font-medium mb-3 text-center" style={{ color: COLORS.danger }}>
                    Liste wirklich leeren?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: COLORS.surface, color: COLORS.ink }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => { onClear(); setShowClearConfirm(false); }}
                      className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ backgroundColor: COLORS.danger }}
                    >
                      Ja, leeren
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ShoppingItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        backgroundColor: item.checked ? COLORS.mutedLight : COLORS.surface,
        boxShadow: '0 1px 4px rgba(35,40,58,0.07)',
        transition: 'all 0.2s ease',
      }}
    >
      <button
        onClick={onToggle}
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          borderColor: item.checked ? COLORS.primary : COLORS.muted,
          backgroundColor: item.checked ? COLORS.primary : 'transparent',
        }}
        aria-label={item.checked ? 'Abhaken rückgängig' : 'Abhaken'}
      >
        {item.checked && <span className="text-white text-xs">✓</span>}
      </button>

      <span
        className="flex-1 text-sm"
        style={{
          color: item.checked ? COLORS.muted : COLORS.ink,
          textDecoration: item.checked ? 'line-through' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {item.name}
      </span>

      <button
        onClick={onRemove}
        className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all active:scale-90"
        style={{ color: COLORS.muted }}
        aria-label="Löschen"
      >
        ✕
      </button>
    </div>
  );
}
