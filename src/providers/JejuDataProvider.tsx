import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { fetchCulturePage, getCultureBackendConfig } from '@/src/services/appwriteCulture';
import { JejuItem, ResourceKind, resourceKinds } from '@/src/types/jeju';

type ResourceState = {
  items: JejuItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  cursor?: string;
  error?: string;
  fromCache: boolean;
};

type ContextValue = {
  resources: Record<ResourceKind, ResourceState>;
  allItems: JejuItem[];
  refresh: (kind?: ResourceKind) => Promise<void>;
  loadMore: (kind: ResourceKind) => Promise<void>;
  findItem: (kind: ResourceKind, id: string) => JejuItem | undefined;
};

const emptyState = (): ResourceState => ({ items: [], loading: true, refreshing: false, loadingMore: false, hasMore: true, totalCount: 0, fromCache: false });
const initialResources = Object.fromEntries(resourceKinds.map((kind) => [kind, emptyState()])) as Record<
  ResourceKind,
  ResourceState
>;
const DataContext = createContext<ContextValue | null>(null);

function cacheKey(kind: ResourceKind) {
  return `@jeju/resource/${kind}/appwrite/v3`;
}

export function JejuDataProvider({ children }: PropsWithChildren) {
  const [resources, setResources] = useState(initialResources);
  const backendConfigured = Boolean(getCultureBackendConfig());

  const load = useCallback(async (kind: ResourceKind, manual = false) => {
    setResources((current) => ({
      ...current,
      [kind]: {
        ...current[kind],
        loading: !current[kind].items.length,
        refreshing: manual && current[kind].items.length > 0,
        error: undefined,
      },
    }));

    if (!manual) {
      try {
        const saved = await AsyncStorage.getItem(cacheKey(kind));
        if (saved) {
          const items = JSON.parse(saved) as JejuItem[];
          if (items.length) {
            setResources((current) => ({
              ...current,
              [kind]: { items, loading: false, refreshing: true, loadingMore: false, hasMore: false, totalCount: items.length, fromCache: true },
            }));
          }
        }
      } catch {
        // A bad cache must never block a fresh request.
      }
    }

    try {
      const page = await fetchCulturePage(kind);
      setResources((current) => ({
        ...current,
        [kind]: { items: page.items, loading: false, refreshing: false, loadingMore: false, hasMore: page.hasMore, totalCount: page.total, cursor: page.nextCursor, fromCache: false },
      }));
      void AsyncStorage.setItem(cacheKey(kind), JSON.stringify(page.items));
    } catch (error) {
      setResources((current) => ({
        ...current,
        [kind]: {
          ...current[kind],
          loading: false,
          refreshing: false,
          error: error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.',
        },
      }));
    }
  }, []);

  const loadMore = useCallback(async (kind: ResourceKind) => {
    const current = resources[kind];
    if (!backendConfigured || current.loading || current.refreshing || current.loadingMore || !current.hasMore || !current.cursor) return;
    setResources((value) => ({ ...value, [kind]: { ...value[kind], loadingMore: true, error: undefined } }));
    try {
      const page = await fetchCulturePage(kind, current.cursor);
      setResources((value) => {
        const previous = value[kind];
        const items = [...previous.items, ...page.items.filter((item) => !previous.items.some((loaded) => loaded.id === item.id))];
        return { ...value, [kind]: { ...previous, items, loadingMore: false, hasMore: page.hasMore, totalCount: page.total || previous.totalCount, cursor: page.nextCursor } };
      });
      void AsyncStorage.setItem(cacheKey(kind), JSON.stringify([...current.items, ...page.items]));
    } catch (error) {
      setResources((value) => ({ ...value, [kind]: { ...value[kind], loadingMore: false, error: error instanceof Error ? error.message : '데이터를 더 불러오지 못했습니다.' } }));
    }
  }, [backendConfigured, resources]);

  useEffect(() => {
    resourceKinds.forEach((kind) => void load(kind));
  }, [load]);

  const refresh = useCallback(
    async (kind?: ResourceKind) => {
      if (kind) return load(kind, true);
      await Promise.all(resourceKinds.map((target) => load(target, true)));
    },
    [load],
  );

  const allItems = useMemo(() => resourceKinds.flatMap((kind) => resources[kind].items), [resources]);
  const findItem = useCallback(
    (kind: ResourceKind, id: string) => resources[kind].items.find((item) => item.id === id),
    [resources],
  );

  return (
    <DataContext.Provider value={{ resources, allItems, refresh, loadMore, findItem }}>
      {children}
    </DataContext.Provider>
  );
}

export function useJejuData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useJejuData must be used inside JejuDataProvider');
  return value;
}
