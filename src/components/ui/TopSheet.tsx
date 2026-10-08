import type { ReactNode } from 'react';
import { COLORS, SHADOWS } from '../../theme';
import { useVisualViewport } from '../../useVisualViewport';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  /** Inhalt unter dem Titel, der nicht mitscrollt (z. B. Suchfeld) */
  header?: ReactNode;
  /** Scrollbarer Bereich */
  children: ReactNode;
}

/**
 * Oben verankertes Fenster, das exakt den sichtbaren Bereich über der Handy-Tastatur
 * ausfüllt – Suchfeld und Ergebnisse verschwinden so nie hinter der Tastatur.
 */
export default function TopSheet({ title, onClose, header, children }: Props) {
  const viewport = useVisualViewport();
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
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{ backgroundColor: COLORS.surface, boxShadow: SHADOWS.raised }}
              aria-label="Schließen"
            >
              <X size={18} strokeWidth={2} color={COLORS.ink} />
            </button>
          </div>
          {header}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5" style={{ overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
