import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { jejuPlaces } from '@/src/data/places';
import { fetchAppwritePlaces, getPlaceBackendConfig } from '@/src/services/appwritePlaces';
import { JejuPlace } from '@/src/types/place';

const CACHE_KEY = '@jeju/places/appwrite/v1';
const CACHE_VERSION = 2;
const CACHE_FRESHNESS_MS = 6 * 60 * 60 * 1_000;

type PlaceCache = {
  version: number;
  cachedAt: string;
  places: JejuPlace[];
};

type PlaceDataValue = {
  places: JejuPlace[];
  loading: boolean;
  refreshing: boolean;
  fromCache: boolean;
  source: 'bundled' | 'cache' | 'remote';
  lastUpdatedAt?: string;
  backendConfigured: boolean;
  error?: string;
  refresh: () => Promise<void>;
  findPlace: (id: string) => JejuPlace | undefined;
};

const PlaceDataContext = createContext<PlaceDataValue | null>(null);

export function PlaceDataProvider({ children }: PropsWithChildren) {
  const [places, setPlaces] = useState<JejuPlace[]>(jejuPlaces);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [source, setSource] = useState<'bundled' | 'cache' | 'remote'>('bundled');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [error, setError] = useState<string>();
  const backendConfigured = Boolean(getPlaceBackendConfig());

  const load = useCallback(async (manual = false) => {
    setError(undefined);
    setRefreshing(manual);

    if (!manual) {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const snapshot = parsePlaceCache(cached);
          if (snapshot?.places.length) {
            setPlaces(snapshot.places);
            setFromCache(true);
            setSource('cache');
            setLastUpdatedAt(latestCollectedAt(snapshot.places));
            if (Date.now() - Date.parse(snapshot.cachedAt) < CACHE_FRESHNESS_MS) {
              setLoading(false);
              setRefreshing(false);
              return;
            }
          }
        }
      } catch {
        // Invalid cache falls back to bundled content and a fresh request.
      }
    }

    if (!backendConfigured) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const next = await fetchAppwritePlaces();
      setPlaces(next);
      setFromCache(false);
      setSource('remote');
      setLastUpdatedAt(latestCollectedAt(next));
      const snapshot: PlaceCache = {
        version: CACHE_VERSION,
        cachedAt: new Date().toISOString(),
        places: next,
      };
      void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '장소 정보를 갱신하지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [backendConfigured]);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const value = useMemo<PlaceDataValue>(() => ({
    places,
    loading,
    refreshing,
    fromCache,
    source,
    lastUpdatedAt,
    backendConfigured,
    error,
    refresh: () => load(true),
    findPlace: (id) => places.find((place) => place.id === id),
  }), [backendConfigured, error, fromCache, lastUpdatedAt, load, loading, places, refreshing, source]);

  return <PlaceDataContext.Provider value={value}>{children}</PlaceDataContext.Provider>;
}

function parsePlaceCache(value: string): PlaceCache | null {
  const parsed = JSON.parse(value) as unknown;
  if (Array.isArray(parsed)) {
    return {
      version: 1,
      cachedAt: new Date(0).toISOString(),
      places: parsed.filter(isCachedPlace),
    };
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const snapshot = parsed as Partial<PlaceCache>;
  if (!Array.isArray(snapshot.places) || typeof snapshot.cachedAt !== 'string' || !Number.isFinite(Date.parse(snapshot.cachedAt))) {
    return null;
  }
  return {
    version: typeof snapshot.version === 'number' ? snapshot.version : 1,
    cachedAt: snapshot.cachedAt,
    places: snapshot.places.filter(isCachedPlace),
  };
}

function isCachedPlace(value: unknown): value is JejuPlace {
  if (!value || typeof value !== 'object') return false;
  const place = value as Partial<JejuPlace>;
  return typeof place.id === 'string'
    && typeof place.name === 'string'
    && typeof place.latitude === 'number'
    && Number.isFinite(place.latitude)
    && typeof place.longitude === 'number'
    && Number.isFinite(place.longitude);
}

function latestCollectedAt(places: JejuPlace[]) {
  return places
    .map((place) => place.collectedAt)
    .filter((value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export function usePlaceData() {
  const value = useContext(PlaceDataContext);
  if (!value) throw new Error('usePlaceData must be used inside PlaceDataProvider');
  return value;
}
