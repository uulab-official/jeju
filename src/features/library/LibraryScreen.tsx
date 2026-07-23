import { useScrollToTop } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/src/components/ContentState';
import { ItemRow } from '@/src/components/ItemRow';
import { SearchField } from '@/src/components/SearchField';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { searchCultureItems } from '@/src/services/appwriteCulture';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { ResourceKind, resourceMeta } from '@/src/types/jeju';

const SEARCH_DEBOUNCE_MS = 320;

export function LibraryScreen({ kind }: { kind: ResourceKind }) {
  const { colors } = useAppTheme();
  const { resources, refresh, loadMore } = useJejuData();
  const state = resources[kind];
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ query: string; items: typeof state.items } | null>(null);
  const listRef = useRef<FlatList>(null);
  const fallbackItemsRef = useRef(state.items);
  useScrollToTop(listRef);
  useEffect(() => {
    fallbackItemsRef.current = state.items;
  }, [state.items]);

  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  useEffect(() => {
    let cancelled = false;
    if (!normalizedQuery) return () => { cancelled = true; };
    const timer = setTimeout(() => {
      void searchCultureItems(normalizedQuery, kind).then((results) => {
        if (!cancelled) setSearchResult({ query: normalizedQuery, items: results });
      }).catch(() => {
        if (!cancelled) {
          setSearchResult({
            query: normalizedQuery,
            items: fallbackItemsRef.current.filter((item) => item.searchText.includes(normalizedQuery)),
          });
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kind, normalizedQuery]);
  const searching = Boolean(normalizedQuery) && searchResult?.query !== normalizedQuery;
  const items = normalizedQuery ? (searchResult?.query === normalizedQuery ? searchResult.items : []) : state.items;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title={resourceMeta[kind].label} subtitle={`${(state.totalCount || state.items.length).toLocaleString()}개 낱말`} />
      <View style={styles.search}><SearchField value={query} onChangeText={setQuery} /></View>
      {state.loading && !state.items.length ? <ListSkeleton rows={6} /> : state.error && !state.items.length ? (
        <ErrorState message={state.error} onRetry={() => void refresh(kind)} />
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.list}
          data={items}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          ListEmptyComponent={searching ? <ListSkeleton rows={3} /> : <EmptyState title="검색 결과가 없어요" message="다른 제주어나 뜻으로 다시 찾아보세요." />}
          ListFooterComponent={state.loadingMore ? <Text style={[styles.cache, { color: colors.muted }]}>다음 20개를 불러오는 중…</Text> : state.fromCache ? <Text style={[styles.cache, { color: colors.muted }]}>저장된 우리 데이터를 표시하고 있어요. 연결되면 자동으로 갱신됩니다.</Text> : null}
          onEndReached={() => { if (!normalizedQuery) void loadMore(kind); }}
          onEndReachedThreshold={0.5}
          onScrollBeginDrag={Keyboard.dismiss}
          refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={() => void refresh(kind)} tintColor={colors.primary} />}
          renderItem={({ item }) => <ItemRow item={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  search: { paddingHorizontal: 18, paddingBottom: 12 },
  list: { paddingHorizontal: 18, paddingBottom: 32, flexGrow: 1 },
  cache: { fontSize: 12, textAlign: 'center', paddingVertical: 18 },
});
