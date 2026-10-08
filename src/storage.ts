/** Kleine Helfer für localStorage – schlagen nie fehl (z. B. privater Modus, gesperrter Speicher). */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speicher nicht verfügbar – die App funktioniert trotzdem, nur ohne Persistenz
  }
}
