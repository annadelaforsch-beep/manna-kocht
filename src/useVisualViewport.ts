import { useEffect, useState } from 'react';

interface ViewportBox {
  height: number;
  offsetTop: number;
}

function read(): ViewportBox {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (vv) return { height: vv.height, offsetTop: vv.offsetTop };
  return { height: typeof window !== 'undefined' ? window.innerHeight : 0, offsetTop: 0 };
}

/**
 * Liefert Höhe und Offset des *sichtbaren* Bereichs (visual viewport).
 * Auf Mobilgeräten schrumpft dieser, sobald die Tastatur aufgeht — fixed
 * positionierte Layer (z.B. Bottom-Sheets) lassen sich damit exakt über
 * der Tastatur platzieren, statt dahinter zu verschwinden.
 */
export function useVisualViewport(): ViewportBox {
  const [box, setBox] = useState<ViewportBox>(read);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setBox(read());
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return box;
}
