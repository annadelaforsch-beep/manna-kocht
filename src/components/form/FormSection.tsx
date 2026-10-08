import type { ReactNode } from 'react';
import { COLORS } from '../../theme';

/** Beschriftung (+ optionaler Hinweis) über einem Formularfeld. */
export default function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: COLORS.ink }}>
        {title}
      </label>
      {hint && (
        <p className="text-xs -mt-1 mb-2" style={{ color: COLORS.muted }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}
