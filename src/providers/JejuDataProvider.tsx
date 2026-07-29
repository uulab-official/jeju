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

import { fetchCultureItem, fetchCulturePage, getCultureBackendConfig } from '@/src/services/appwriteCulture';
import { JejuItem, ResourceKind, resourceKinds } from '@/src/types/jeju';

type ResourceCache = {
  version: 1;
  items: JejuItem[];
  cursor?: string;
  hasMore: boolean;
  totalCount: number;
};

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
  rememberItem: (item: JejuItem) => void;
  resolveItem: (kind: ResourceKind, id: string) => Promise<JejuItem | undefined>;
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
  const [resolvedItems, setResolvedItems] = useState<Record<string, JejuItem>>({});
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
          const parsed = JSON.parse(saved) as JejuItem[] | Partial<ResourceCache>;
          const cache: ResourceCache = Array.isArray(parsed)
            ? { version: 1, items: parsed, hasMore: false, totalCount: parsed.length }
            : {
                version: 1,
                items: Array.isArray(parsed.items) ? parsed.items : [],
                cursor: typeof parsed.cursor === 'string' ? parsed.cursor : undefined,
                hasMore: parsed.hasMore === true,
                totalCount: Number.isFinite(parsed.totalCount) ? Number(parsed.totalCount) : 0,
              };
          if (cache.items.length) {
            setResources((current) => ({
              ...current,
              [kind]: {
                items: cache.items,
                loading: false,
                refreshing: true,
                loadingMore: false,
                hasMore: cache.hasMore && Boolean(cache.cursor),
                totalCount: cache.totalCount || cache.items.length,
                cursor: cache.cursor,
                fromCache: true,
              },
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
      void AsyncStorage.setItem(cacheKey(kind), JSON.stringify({
        version: 1,
        items: page.items,
        cursor: page.nextCursor,
        hasMore: page.hasMore,
        totalCount: page.total,
      } satisfies ResourceCache));
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
      void AsyncStorage.setItem(cacheKey(kind), JSON.stringify({
        version: 1,
        items: [...current.items, ...page.items],
        cursor: page.nextCursor,
        hasMore: page.hasMore,
        totalCount: page.total || current.totalCount,
      } satisfies ResourceCache));
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

  const allItems = useMemo(() => {
    const merged = new Map<string, JejuItem>();
    resourceKinds.flatMap((kind) => resources[kind].items).forEach((item) => merged.set(`${item.kind}:${item.id}`, item));
    Object.values(resolvedItems).forEach((item) => merged.set(`${item.kind}:${item.id}`, item));
    return [...merged.values()];
  }, [resolvedItems, resources]);
  const findItem = useCallback(
    (kind: ResourceKind, id: string) => resources[kind].items.find((item) => item.id === id) ?? resolvedItems[`${kind}:${id}`],
    [resolvedItems, resources],
  );
  const rememberItem = useCallback((item: JejuItem) => {
    setResolvedItems((current) => {
      const key = `${item.kind}:${item.id}`;
      if (current[key] === item) return current;
      return { ...current, [key]: item };
    });
  }, []);
  const resolveItem = useCallback(async (kind: ResourceKind, id: string) => {
    const item = await fetchCultureItem(kind, id);
    if (item) rememberItem(item);
    return item;
  }, [rememberItem]);

  return (
    <DataContext.Provider value={{ resources, allItems, refresh, loadMore, findItem, rememberItem, resolveItem }}>
      {children}
    </DataContext.Provider>
  );
}

export function useJejuData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useJejuData must be used inside JejuDataProvider');
  return value;
}
