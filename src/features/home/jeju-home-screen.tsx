import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useScrollToTop } from 'expo-router';
import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { SectionHeading } from '@/src/components/SectionHeading';
import { resolveGuidePlaces, travelGuides } from '@/src/data/travel-guides';
import { PlaceCard } from '@/src/features/discover/components/place-card';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { layout } from '@/src/theme/tokens';
import { resourceKinds, resourceMeta } from '@/src/types/jeju';

export function JejuHomeScreen() {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { resources, refresh: refreshResources } = useJejuData();
  const { places, refreshing: placesRefreshing, refresh: refreshPlaces } = usePlaceData();
  const refreshing = placesRefreshing || Object.values(resources).some((state) => state.refreshing);
  const month = new Date().getMonth() + 1;
  const season = month >= 6 && month <= 8 ? '여름의 제주' : month >= 9 && month <= 11 ? '가을의 제주' : month <= 2 ? '겨울의 제주' : '봄의 제주';
  const featuredPlace = places.find((place) => place.heroImageUrl) ?? places[0];
  const guides = travelGuides.map((guide) => ({ guide, placeCount: resolveGuidePlaces(guide, places).length }));
  const refresh = async () => {
    await Promise.all([refreshResources(), refreshPlaces()]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="소랑제주"
        right={<View style={styles.actions}>
          <HapticPressable accessibilityLabel="제주 검색" feedback="light" onPress={() => router.push('/search')} style={styles.headerButton}><Ionicons name="search" size={22} color={colors.text} /></HapticPressable>
          <HapticPressable accessibilityLabel="알림" feedback="light" onPress={() => router.push('/notifications')} style={styles.headerButton}><Ionicons name="notifications-outline" size={22} color={colors.text} /></HapticPressable>
        </View>}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primaryStrong} />}>
        <HapticPressable
          accessibilityLabel={featuredPlace ? `${featuredPlace.name} 상세 보기` : '지도에서 제주 둘러보기'}
          feedback="medium"
          onPress={() => featuredPlace
            ? router.push({ pathname: '/places/[id]', params: { id: featuredPlace.id } })
            : router.push('/map')}
          style={[styles.hero, { backgroundColor: colors.surfaceAlt }]}
        >
          {featuredPlace?.heroImageUrl ? <Image source={{ uri: featuredPlace.heroImageUrl }} contentFit="cover" transition={180} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} /> : null}
          <LinearGradient colors={['rgba(24,18,13,0.03)', 'rgba(24,18,13,0.78)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroCopy}>
            <Text selectable style={styles.heroEyebrow}>{season} · 오늘의 제주</Text>
            <Text selectable numberOfLines={2} style={styles.heroTitle}>{featuredPlace?.name ?? '지도에서 제주를 만나보세요'}</Text>
            <View style={styles.heroMeta}>
              <Text selectable numberOfLines={1} style={styles.heroMetaText}>{featuredPlace ? `${featuredPlace.region} · ${featuredPlace.area}` : '공식 관광정보로 둘러보기'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </View>
        </HapticPressable>

        <View style={[styles.quickNav, { borderColor: colors.border }]}>
          {activityModes.map((mode) => (
            <HapticPressable
              key={mode.label}
              feedback="selection"
              onPress={() => router.push({ pathname: '/search', params: { category: mode.category } })}
              style={styles.quickNavItem}
            >
              <Ionicons name={mode.icon as never} size={20} color={colors.primaryStrong} />
              <Text numberOfLines={1} style={[styles.quickNavLabel, { color: colors.text }]}>{mode.label}</Text>
            </HapticPressable>
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeading title="여행 가이드" caption="공식 관광정보로 만든 제주 동선" />
          <View style={[styles.guideList, { borderColor: colors.border }]}>
            {guides.slice(0, 4).map(({ guide, placeCount }, index) => (
              <HapticPressable
                key={guide.id}
                feedback="medium"
                onPress={() => router.push({ pathname: '/guides/[id]', params: { id: guide.id } })}
                style={[styles.guideRow, index < 3 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
              >
                <Text style={[styles.guideIndex, { color: colors.primaryStrong }]}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.guideCopy}>
                  <Text selectable numberOfLines={1} style={[styles.guideTitle, { color: colors.text }]}>{guide.title}</Text>
                  <Text selectable numberOfLines={1} style={[styles.guideMetaText, { color: colors.muted }]}>{guide.eyebrow} · {guide.duration} · {placeCount}곳</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </HapticPressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading title="처음 만나는 제주" caption="공식 관광정보에서 고른 장소" action={{ label: '전체 보기', onPress: () => router.push('/search') }} />
          <ScrollView horizontal contentContainerStyle={styles.horizontal} showsHorizontalScrollIndicator={false}>
            {places.slice(0, 6).map((place) => <PlaceCard compact key={place.id} place={place} />)}
          </ScrollView>
        </View>

        <HapticPressable feedback="medium" onPress={() => router.push('/history')} style={styles.historyBanner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.historyEyebrow}>탐라에서 4·3과 평화까지</Text>
            <Text selectable style={styles.historyTitle}>제주 역사를 걷다</Text>
            <Text selectable style={styles.historyText}>시대 이야기와 지금 가볼 장소를 함께 만나요</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#FFF4E8" />
        </HapticPressable>

        <View style={styles.section}>
          <SectionHeading title="제주의 말과 삶" caption="제주어 자료와 표기법" />
          <View style={[styles.cultureList, { borderColor: colors.border }]}>
            {resourceKinds.map((kind, index) => {
              const meta = resourceMeta[kind];
              return (
                <HapticPressable
                  key={kind}
                  onPress={() => router.push({ pathname: '/library/[kind]', params: { kind } })}
                  style={[styles.cultureRow, index < resourceKinds.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                >
                  <Text selectable style={[styles.cultureTitle, { color: colors.text }]}>{meta.shortLabel}</Text>
                  <Text selectable style={[styles.cultureCount, { color: colors.muted }]}>{(resources[kind].totalCount || resources[kind].items.length).toLocaleString()}개</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </HapticPressable>
              );
            })}
            <HapticPressable onPress={() => router.push('/language/notation')} style={styles.cultureRow}>
              <Text selectable style={[styles.cultureTitle, { color: colors.text }]}>제주어 표기법</Text>
              <Text selectable style={[styles.cultureCount, { color: colors.muted }]}>읽고 적는 원칙</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </HapticPressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const activityModes = [
  { label: '액티비티', category: 'activity', icon: 'bicycle-outline' },
  { label: '걷는 제주', category: 'walk', icon: 'walk-outline' },
  { label: '섬 여행', category: 'island', icon: 'boat-outline' },
  { label: '문화', category: 'culture', icon: 'color-palette-outline' },
] as const;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: layout.screenBottomPadding, gap: 24 },
  actions: { flexDirection: 'row' },
  headerButton: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 214, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end', borderCurve: 'continuous' },
  heroCopy: { padding: 18, gap: 6 },
  heroEyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontFamily: 'NanumOld', fontSize: 27, lineHeight: 34 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroMetaText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  quickNav: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  quickNavItem: { flex: 1, minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 7 },
  quickNavLabel: { fontSize: 12, fontWeight: '700' },
  section: { gap: 10 },
  guideList: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  guideRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12 },
  guideIndex: { width: 24, fontSize: 12, fontWeight: '900' },
  guideCopy: { flex: 1, gap: 4 },
  guideTitle: { fontSize: 16, fontWeight: '800' },
  guideMetaText: { fontSize: 12 },
  horizontal: { gap: 12, paddingRight: 18 },
  historyBanner: { minHeight: 116, borderRadius: 14, padding: 18, backgroundColor: '#49342D', flexDirection: 'row', alignItems: 'center', gap: 14, borderCurve: 'continuous' },
  bannerCopy: { flex: 1, gap: 4 },
  historyEyebrow: { color: 'rgba(255,244,232,0.68)', fontSize: 11, fontWeight: '800' },
  historyTitle: { color: '#FFF8F1', fontFamily: 'NanumOld', fontSize: 22 },
  historyText: { color: 'rgba(255,248,241,0.82)', fontSize: 12, lineHeight: 18 },
  cultureList: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  cultureRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cultureTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  cultureCount: { fontSize: 12 },
});
