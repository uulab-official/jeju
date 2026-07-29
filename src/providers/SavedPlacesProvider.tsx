import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@jeju/saved-places/v1';

type SavedPlacesContextValue = {
  savedIds: ReadonlySet<string>;
  ready: boolean;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
};

const SavedPlacesContext = createContext<SavedPlacesContextValue | null>(null);

export function SavedPlacesProvider({ children }: PropsWithChildren) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        setSavedIds(new Set(JSON.parse(value) as string[]));
      } catch {
        void AsyncStorage.removeItem(STORAGE_KEY);
      }
    }).catch(() => undefined).finally(() => setReady(true));
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ savedIds, ready, toggleSaved, isSaved: (id: string) => savedIds.has(id) }), [ready, savedIds, toggleSaved]);
  return <SavedPlacesContext.Provider value={value}>{children}</SavedPlacesContext.Provider>;
}

export function useSavedPlaces() {
  const value = useContext(SavedPlacesContext);
  if (!value) throw new Error('useSavedPlaces must be used inside SavedPlacesProvider');
  return value;
}
