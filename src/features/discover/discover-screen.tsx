import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, useScrollToTop } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { SearchField } from '@/src/components/SearchField';
import { placeCategories } from '@/src/data/places';
import { PlaceCard } from '@/src/features/discover/components/place-card';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { PlaceCategory } from '@/src/types/place';

export function DiscoverScreen() {
  const { colors } = useAppTheme();
  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);
  const params = useLocalSearchParams<{ category?: string }>();
  const { places: allPlaces, refreshing, refresh, source, lastUpdatedAt } = usePlaceData();
  const [query, setQuery] = useState('');
  const category: PlaceCategory | 'all' = placeCategories.find((item) => item.id === params.category)?.id ?? 'all';
  const places = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ko-KR');
    return allPlaces.filter((place) => {
      const matchesCategory = category === 'all' || place.category === category;
      const text = `${place.name} ${place.region} ${place.area} ${place.summary} ${place.tags.join(' ')}`.toLocaleLowerCase('ko-KR');
      return matchesCategory && (!normalized || text.includes(normalized));
    });
  }, [allPlaces, category, query]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="발견" subtitle="액티비티·여행지·문화" />
      <View style={styles.search}><SearchField value={query} onChangeText={setQuery} /></View>
      <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
        {placeCategories.map((item) => {
          const selected = category === item.id;
          return <HapticPressable key={item.id} feedback="selection" onPress={() => router.setParams({ category: item.id })} style={[styles.filter, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}><Ionicons name={item.icon as never} size={16} color={selected ? colors.onPrimary : colors.muted} /><Text style={[styles.filterText, { color: selected ? colors.onPrimary : colors.text }]}>{item.label}</Text></HapticPressable>;
        })}
      </ScrollView>
      <FlatList
        ref={listRef}
        contentContainerStyle={styles.list}
        data={places}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primaryStrong} />}
        ListHeaderComponent={<Text selectable style={[styles.count, { color: colors.muted }]}>{places.length}곳을 찾았어요 · {sourceLabel[source]}{lastUpdatedAt ? ` · ${formatCollectedAt(lastUpdatedAt)}` : ''}</Text>}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="compass-outline" size={34} color={colors.muted} /><Text selectable style={[styles.emptyTitle, { color: colors.text }]}>조건에 맞는 장소가 없어요</Text><Text selectable style={[styles.emptyText, { color: colors.muted }]}>검색어나 카테고리를 바꿔 보세요.</Text></View>}
        renderItem={({ item }) => <PlaceCard place={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, search: { paddingHorizontal: 18, paddingBottom: 10 }, filters: { paddingHorizontal: 18, gap: 8, paddingBottom: 14 }, filter: { height: 38, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 }, filterText: { fontSize: 12, fontWeight: '800' }, list: { paddingHorizontal: 18, paddingBottom: 34, flexGrow: 1 }, count: { fontSize: 12, paddingBottom: 10 }, separator: { height: 12 }, empty: { alignItems: 'center', paddingVertical: 60, gap: 8 }, emptyTitle: { fontSize: 16, fontWeight: '800' }, emptyText: { fontSize: 13 } });

const sourceLabel = { bundled: '기본 정보', cache: '저장된 정보', remote: '공식 데이터' } as const;

function formatCollectedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `${date.getMonth() + 1}/${date.getDate()} 기준`;
}
