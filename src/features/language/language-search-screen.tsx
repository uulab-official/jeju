import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState, ListSkeleton } from '@/src/components/ContentState';
import { HapticPressable } from '@/src/components/HapticPressable';
import { ItemRow } from '@/src/components/ItemRow';
import { SearchField } from '@/src/components/SearchField';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { searchCultureItems } from '@/src/services/appwriteCulture';
import { layout, pretendard, typography } from '@/src/theme/tokens';

const SEARCH_DEBOUNCE_MS = 320;
const STARTER_QUERIES = [
  { term: '바당', hint: '제주에서 바다를 부르는 말' },
  { term: '혼저', hint: '어서, 얼른이라는 뜻' },
  { term: '하르방', hint: '할아버지를 이르는 제주어' },
  { term: '고맙수다', hint: '제주의 다정한 감사 인사' },
] as const;

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
      <View style={styles.search}><SearchField value={query} onChangeText={setQuery} /></View>
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
          ) : !normalized ? (
            <View style={styles.starter}>
              <Text style={[styles.eyebrow, { color: colors.primaryStrong }]}>제주어 한 마디</Text>
              <Text style={[styles.starterTitle, { color: colors.text }]}>말을 알면 제주가 더 가까워져요</Text>
              <Text style={[styles.starterBody, { color: colors.muted }]}>낱말과 뜻풀이, 속담과 옛 표기까지 한 번에 찾아보세요.</Text>
              <View style={[styles.suggestions, { borderColor: colors.border }]}>
                {STARTER_QUERIES.map((item, index) => (
                  <HapticPressable
                    accessibilityLabel={`${item.term} 검색: ${item.hint}`}
                    key={item.term}
                    onPress={() => {
                      Keyboard.dismiss();
                      setQuery(item.term);
                    }}
                    style={[styles.suggestion, index < STARTER_QUERIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <View style={styles.suggestionCopy}>
                      <Text style={[styles.suggestionTerm, { color: colors.text }]}>{item.term}</Text>
                      <Text style={[styles.suggestionHint, { color: colors.muted }]}>{item.hint}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={17} color={colors.muted} />
                  </HapticPressable>
                ))}
              </View>
            </View>
          ) : (
            <EmptyState
              icon="search-outline"
              title="일치하는 제주어가 없어요"
              message="띄어쓰기나 다른 뜻풀이로 다시 검색해 보세요."
            />
          )}
          onScrollBeginDrag={Keyboard.dismiss}
          renderItem={({ item }) => <ItemRow item={item} showKind />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  search: { paddingHorizontal: layout.screenPadding, paddingBottom: 12 },
  list: { paddingHorizontal: layout.screenPadding, paddingBottom: 32, flexGrow: 1 },
  count: { ...typography.caption, marginBottom: 10 },
  separator: { height: 10 },
  starter: { paddingTop: 26 },
  eyebrow: { ...typography.label, marginBottom: 10 },
  starterTitle: { ...pretendard(800), fontSize: 22, lineHeight: 30, letterSpacing: -0.4 },
  starterBody: { ...typography.body, maxWidth: 300, marginTop: 8 },
  suggestions: { borderTopWidth: 1, borderBottomWidth: 1, marginTop: 28 },
  suggestion: { minHeight: 67, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  suggestionCopy: { flex: 1, gap: 3 },
  suggestionTerm: { ...typography.subheading, fontSize: 15 },
  suggestionHint: { ...typography.caption },
});
