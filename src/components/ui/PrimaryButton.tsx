import type { ButtonHTMLAttributes } from 'react';
import { COLORS, SHADOWS } from '../../theme';

/** Große Haupt-Aktion (volle Breite, Petrol) – z. B. Speichern oder Einkaufsliste erstellen. */
export default function PrimaryButton({
  className = '',
  style,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full py-4 rounded-2xl text-white font-semibold text-sm transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 ${className}`}
      style={{ backgroundColor: COLORS.primary, boxShadow: SHADOWS.primaryLg, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
