import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState, ListSkeleton } from '@/src/components/ContentState';
import { ItemRow } from '@/src/components/ItemRow';
import { SearchField } from '@/src/components/SearchField';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { searchCultureItems } from '@/src/services/appwriteCulture';

const SEARCH_DEBOUNCE_MS = 320;

export function LanguageSearchScreen() {
  const { colors } = useAppTheme();
  const { allItems, resources } = useJejuData();
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ query: string; items: typeof allItems } | null>(null);
  const fallbackItemsRef = useRef(allItems);
  useEffect(() => {
    fallbackItemsRef.current = allItems;
  }, [allItems]);
  const loading = Object.values(resources).some((state) => state.loading);
  const normalized = query.trim().toLocaleLowerCase('ko-KR');
  useEffect(() => {
    let cancelled = false;
    if (!normalized) return () => { cancelled = true; };
    const timer = setTimeout(() => {
      void searchCultureItems(normalized).then((items) => {
        if (!cancelled) setSearchResult({ query: normalized, items });
      }).catch(() => {
        if (!cancelled) {
          setSearchResult({
            query: normalized,
            items: fallbackItemsRef.current.filter((item) => item.searchText.includes(normalized)).slice(0, 20),
          });
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalized]);
  const searching = Boolean(normalized) && searchResult?.query !== normalized;
  const results = useMemo(
    () => normalized && searchResult?.query === normalized ? searchResult.items : [],
    [normalized, searchResult],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="제주어 통합 검색" subtitle="생활방언·속담·사전·색인어" back />
      <View style={styles.search}><SearchField autoFocus value={query} onChangeText={setQuery} /></View>
      {loading && !allItems.length ? <ListSkeleton rows={6} /> : (
        <FlatList
          contentContainerStyle={styles.list}
          data={results}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          ListHeaderComponent={normalized ? <Text style={[styles.count, { color: colors.muted }]}>{results.length.toLocaleString()}개 결과{results.length === 20 ? ' (상위 20개)' : ''}</Text> : null}
          ListEmptyComponent={searching ? (
            <ListSkeleton rows={3} />
          ) : (
            <EmptyState
              icon={normalized ? 'search-outline' : 'language-outline'}
              title={normalized ? '일치하는 제주어가 없어요' : '어떤 제주어가 궁금한가요?'}
              message={normalized ? '띄어쓰기나 다른 뜻풀이로 다시 검색해 보세요.' : '낱말뿐 아니라 뜻, 분류, 번역 내용까지 우리 데이터에서 찾아드려요.'}
            />
          )}
          onScrollBeginDrag={Keyboard.dismiss}
          renderItem={({ item }) => <ItemRow item={item} showKind />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, search: { paddingHorizontal: 18, paddingBottom: 12 }, list: { paddingHorizontal: 18, paddingBottom: 28, flexGrow: 1 }, count: { fontSize: 12, marginBottom: 10 }, separator: { height: 10 } });
