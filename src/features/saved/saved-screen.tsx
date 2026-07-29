import Ionicons from '@expo/vector-icons/Ionicons';
import { useScrollToTop } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { ItemRow } from '@/src/components/ItemRow';
import { SectionHeading } from '@/src/components/SectionHeading';
import { PlaceCard } from '@/src/features/discover/components/place-card';
import { itemKey, useFavorites } from '@/src/providers/FavoritesProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { useSavedPlaces } from '@/src/providers/SavedPlacesProvider';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';

export function SavedScreen() {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { savedIds } = useSavedPlaces();
  const { favoriteKeys } = useFavorites();
  const { allItems } = useJejuData();
  const { places: allPlaces } = usePlaceData();
  const places = allPlaces.filter((place) => savedIds.has(place.id));
  const words = allItems.filter((item) => favoriteKeys.has(itemKey(item.kind, item.id)));
  const empty = !places.length && !words.length;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="저장" subtitle={`${places.length + words.length}개`} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {empty ? <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name="bookmark-outline" size={31} color={colors.primaryStrong} /></View><Text selectable style={[styles.emptyTitle, { color: colors.text }]}>마음에 드는 제주를 모아보세요</Text><Text selectable style={[styles.emptyText, { color: colors.muted }]}>여행지와 제주어를 저장하면 여기에서 다시 볼 수 있어요.</Text></View> : null}
        {places.length ? <View style={styles.section}><SectionHeading title="가보고 싶은 곳" />{places.map((place) => <PlaceCard key={place.id} place={place} />)}</View> : null}
        {words.length ? <View style={styles.section}><SectionHeading title="기억하고 싶은 제주어" />{words.map((item) => <ItemRow key={`${item.kind}-${item.id}`} item={item} showKind />)}</View> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 34, flexGrow: 1 }, empty: { flex: 1, minHeight: 440, alignItems: 'center', justifyContent: 'center', gap: 9 }, emptyIcon: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, emptyTitle: { fontSize: 17, fontWeight: '900' }, emptyText: { maxWidth: 270, textAlign: 'center', fontSize: 13, lineHeight: 20 }, section: { gap: 12, paddingBottom: 24 } });
