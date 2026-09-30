import type { Screen } from '../types';
import { COLORS } from '../theme';
import { Utensils, Calendar, ShoppingCart, type LucideIcon } from 'lucide-react';

export type TabScreen = Extract<Screen, 'home' | 'weekplan' | 'shopping'>;

interface Props {
  active: TabScreen;
  onChange: (tab: TabScreen) => void;
}

const TABS: { key: TabScreen; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Rezepte', icon: Utensils },
  { key: 'weekplan', label: 'Wochenplan', icon: Calendar },
  { key: 'shopping', label: 'Einkaufsliste', icon: ShoppingCart },
];

export default function TabBar({ active, onChange }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto flex"
      style={{
        backgroundColor: COLORS.surface,
        boxShadow: '0 -2px 12px rgba(35,40,58,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-transform active:scale-95"
          >
            <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} color={isActive ? COLORS.primary : COLORS.muted} />
            <span
              className="text-[11px] font-medium"
              style={{ color: isActive ? COLORS.primary : COLORS.muted }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
