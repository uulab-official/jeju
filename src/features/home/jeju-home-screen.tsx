import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useScrollToTop } from 'expo-router';
import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { resolveGuidePlaces, travelGuides } from '@/src/data/travel-guides';
import { PlaceCard } from '@/src/features/discover/components/place-card';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
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
  const guides = travelGuides.map((guide) => ({ guide, placeCount: resolveGuidePlaces(guide, places).length }));
  const refresh = async () => {
    await Promise.all([refreshResources(), refreshPlaces()]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="소랑제주"
        subtitle="섬을 더 깊이 만나는 방법"
        right={<View style={styles.actions}>
          <HapticPressable accessibilityLabel="제주 검색" feedback="light" onPress={() => router.push('/search')} style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="search" size={20} color={colors.text} /></HapticPressable>
          <HapticPressable accessibilityLabel="알림" feedback="light" onPress={() => router.push('/notifications')} style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="notifications-outline" size={20} color={colors.text} /></HapticPressable>
        </View>}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primaryStrong} />}>
        <LinearGradient colors={['#FFB45C', '#E66B32', '#B9422D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text selectable style={styles.heroEyebrow}>{season}</Text>
          <Text selectable style={styles.heroTitle}>바람이 이끄는 곳에서{`\n`}나만의 제주를 발견해요</Text>
          <HapticPressable feedback="medium" onPress={() => router.push('/map')} style={styles.heroButton}>
            <Ionicons name="map-outline" size={18} color="#522612" />
            <Text style={styles.heroButtonText}>지도에서 둘러보기</Text>
          </HapticPressable>
          <View style={styles.heroOrb} />
        </LinearGradient>

        <View style={styles.heading}>
          <View><Text selectable style={[styles.sectionTitle, { color: colors.text }]}>제주에서 뭐할까?</Text><Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>지금 끌리는 여행 방식으로 골라보세요</Text></View>
        </View>
        <View style={styles.activityGrid}>
          {activityModes.map((mode) => (
            <HapticPressable
              key={mode.label}
              feedback="selection"
              onPress={() => router.push({ pathname: '/search', params: { category: mode.category } })}
              style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.activityIcon, { backgroundColor: mode.tint }]}><Ionicons name={mode.icon as never} size={22} color={mode.color} /></View>
              <Text style={[styles.activityLabel, { color: colors.text }]}>{mode.label}</Text>
              <Text style={[styles.activityCaption, { color: colors.muted }]}>{mode.caption}</Text>
            </HapticPressable>
          ))}
        </View>

        <View style={styles.heading}>
          <View><Text selectable style={[styles.sectionTitle, { color: colors.text }]}>테마 여행 가이드</Text><Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>공식 관광정보를 동선처럼 이어봤어요</Text></View>
        </View>
        <ScrollView horizontal contentContainerStyle={styles.guideRow} showsHorizontalScrollIndicator={false}>
          {guides.map(({ guide, placeCount }) => (
            <HapticPressable key={guide.id} feedback="medium" onPress={() => router.push({ pathname: '/guides/[id]', params: { id: guide.id } })}>
              <LinearGradient colors={guide.accent} style={styles.guideCard}>
                <View style={styles.guideTop}><Text style={styles.guideEyebrow}>{guide.eyebrow}</Text><Ionicons name={guide.icon as never} size={24} color="#FFFFFF" /></View>
                <View><Text selectable style={styles.guideTitle}>{guide.title}</Text><Text selectable numberOfLines={2} style={styles.guideSummary}>{guide.summary}</Text></View>
                <View style={styles.guideMeta}><Text style={styles.guideMetaText}>{guide.duration} · {placeCount}곳</Text><Ionicons name="arrow-forward" size={17} color="#FFFFFF" /></View>
              </LinearGradient>
            </HapticPressable>
          ))}
        </ScrollView>

        <View style={styles.heading}>
          <View><Text selectable style={[styles.sectionTitle, { color: colors.text }]}>처음 만나는 제주</Text><Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>공식 관광정보를 바탕으로 골랐어요</Text></View>
          <HapticPressable onPress={() => router.push('/search')}><Text style={[styles.more, { color: colors.primaryStrong }]}>전체 보기</Text></HapticPressable>
        </View>
        <ScrollView horizontal contentContainerStyle={styles.horizontal} showsHorizontalScrollIndicator={false}>
          {places.slice(0, 6).map((place) => <PlaceCard compact key={place.id} place={place} />)}
        </ScrollView>

        <HapticPressable feedback="medium" onPress={() => router.push('/history')}>
          <LinearGradient colors={['#C67852', '#744137', '#3E2D31']} style={styles.historyBanner}>
            <View style={styles.historyIcon}><Ionicons name="time-outline" size={25} color="#FFF4E8" /></View>
            <View style={styles.bannerCopy}><Text style={styles.historyEyebrow}>탐라에서 평화의 섬까지</Text><Text selectable style={styles.historyTitle}>제주 역사를 걷다</Text><Text selectable style={styles.historyText}>시대 이야기와 지금 가볼 장소를 함께 만나요</Text></View>
            <Ionicons name="arrow-forward" size={21} color="#FFF4E8" />
          </LinearGradient>
        </HapticPressable>

        <View style={styles.heading}>
          <View><Text selectable style={[styles.sectionTitle, { color: colors.text }]}>제주의 말과 삶</Text><Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>역사와 여행지 너머의 제주를 알아가요</Text></View>
        </View>
        <View style={styles.cultureGrid}>
          {resourceKinds.map((kind) => {
            const meta = resourceMeta[kind];
            return (
              <HapticPressable key={kind} onPress={() => router.push({ pathname: '/library/[kind]', params: { kind } })} style={[styles.cultureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cultureIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name={meta.icon} size={22} color={colors.primaryStrong} /></View>
                <Text selectable style={[styles.cultureTitle, { color: colors.text }]}>{meta.shortLabel}</Text>
                <Text selectable style={[styles.cultureCount, { color: colors.muted }]}>{(resources[kind].totalCount || resources[kind].items.length).toLocaleString()}개</Text>
              </HapticPressable>
            );
          })}
        </View>
        <HapticPressable onPress={() => router.push('/language/notation')} style={[styles.languageBanner, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="language-outline" size={24} color={colors.primaryStrong} />
          <View style={styles.bannerCopy}><Text selectable style={[styles.bannerTitle, { color: colors.text }]}>제주어 표기법</Text><Text selectable style={[styles.bannerText, { color: colors.muted }]}>제주의 말을 바르게 읽고 적는 방법</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </HapticPressable>
      </ScrollView>
    </View>
  );
}

const activityModes = [
  { label: '액티비티', caption: '레포츠·체험', category: 'activity', icon: 'bicycle-outline', tint: '#E3F5EC', color: '#24765C' },
  { label: '걷는 제주', caption: '오름·올레', category: 'walk', icon: 'walk-outline', tint: '#EDF4DE', color: '#577A2E' },
  { label: '섬 여행', caption: '우도·섬 속의 섬', category: 'island', icon: 'boat-outline', tint: '#E3F3F8', color: '#28748E' },
  { label: '문화 산책', caption: '미술·생활문화', category: 'culture', icon: 'color-palette-outline', tint: '#F1E9F8', color: '#76549A' },
] as const;

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 36, gap: 18 }, actions: { flexDirection: 'row', gap: 8 }, headerButton: { width: 40, height: 40, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B2416', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  hero: { minHeight: 232, borderRadius: 30, padding: 24, overflow: 'hidden', justifyContent: 'center', borderCurve: 'continuous', shadowColor: '#8C321D', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 }, heroEyebrow: { color: '#612B16', fontSize: 12, fontWeight: '900', letterSpacing: 0.2 }, heroTitle: { color: '#35170C', fontFamily: 'NanumOld', fontSize: 26, lineHeight: 36, paddingTop: 9 }, heroButton: { alignSelf: 'flex-start', marginTop: 20, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.78)', paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 7 }, heroButtonText: { color: '#522612', fontSize: 13, fontWeight: '900' }, heroOrb: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.13)', right: -38, top: -34 },
  heading: { paddingTop: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionTitle: { fontSize: 20, fontWeight: '900' }, sectionCaption: { fontSize: 12, paddingTop: 4 }, more: { fontSize: 12, fontWeight: '900' }, horizontal: { gap: 12, paddingRight: 18 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, activityCard: { width: '48%', borderWidth: 1, borderRadius: 19, padding: 14, minHeight: 116, borderCurve: 'continuous' }, activityIcon: { width: 41, height: 41, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, activityLabel: { fontSize: 15, fontWeight: '900', paddingTop: 10 }, activityCaption: { fontSize: 11, paddingTop: 3 },
  guideRow: { gap: 12, paddingRight: 18 }, guideCard: { width: 272, minHeight: 202, borderRadius: 24, padding: 19, justifyContent: 'space-between', borderCurve: 'continuous' }, guideTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, guideEyebrow: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '900' }, guideTitle: { color: '#FFFFFF', fontFamily: 'NanumOld', fontSize: 22, lineHeight: 30 }, guideSummary: { color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 18, paddingTop: 5 }, guideMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, guideMetaText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  cultureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, cultureCard: { width: '48%', borderWidth: 1, borderRadius: 20, padding: 15, minHeight: 120, borderCurve: 'continuous', shadowColor: '#3B2416', shadowOpacity: 0.045, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, cultureIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cultureTitle: { fontSize: 15, fontWeight: '800', paddingTop: 10 }, cultureCount: { fontSize: 11, paddingTop: 3 },
  historyBanner: { minHeight: 132, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13, borderCurve: 'continuous', overflow: 'hidden' }, historyIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }, historyEyebrow: { color: 'rgba(255,244,232,0.72)', fontSize: 10, fontWeight: '900' }, historyTitle: { color: '#FFF8F1', fontFamily: 'NanumOld', fontSize: 21, paddingTop: 4 }, historyText: { color: 'rgba(255,248,241,0.82)', fontSize: 11, paddingTop: 4 },
  languageBanner: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderCurve: 'continuous' }, bannerCopy: { flex: 1, gap: 3 }, bannerTitle: { fontSize: 15, fontWeight: '800' }, bannerText: { fontSize: 12 },
});
