import { useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../storage';

/** Favoriten (nur lokal pro Gerät gespeichert). */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => loadFromStorage<string[]>('mk_favorites', []));

  useEffect(() => {
    saveToStorage('mk_favorites', favorites);
  }, [favorites]);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  const removeFavorite = (id: string) => setFavorites((prev) => prev.filter((f) => f !== id));

  return { favorites, toggleFavorite, removeFavorite };
}
