import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ResourceKind } from '@/src/types/jeju';

const STORAGE_KEY = '@jeju/favorites/v1';
const FavoritesContext = createContext<{
  favoriteKeys: Set<string>;
  isFavorite: (kind: ResourceKind, id: string) => boolean;
  toggleFavorite: (kind: ResourceKind, id: string) => boolean;
} | null>(null);

export function itemKey(kind: ResourceKind, id: string) {
  return `${kind}:${id}`;
}

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) setKeys(parsed.filter((value): value is string => typeof value === 'string'));
      } catch {
        // Ignore invalid legacy cache.
      }
    });
  }, []);

  const favoriteKeys = useMemo(() => new Set(keys), [keys]);
  const isFavorite = useCallback((kind: ResourceKind, id: string) => favoriteKeys.has(itemKey(kind, id)), [favoriteKeys]);
  const toggleFavorite = useCallback(
    (kind: ResourceKind, id: string) => {
      const key = itemKey(kind, id);
      const nextFavorite = !favoriteKeys.has(key);
      setKeys((current) => {
        const next = nextFavorite ? [...current, key] : current.filter((value) => value !== key);
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return nextFavorite;
    },
    [favoriteKeys],
  );

  return (
    <FavoritesContext.Provider value={{ favoriteKeys, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites must be used inside FavoritesProvider');
  return value;
}
