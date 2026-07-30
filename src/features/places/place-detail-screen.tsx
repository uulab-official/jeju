import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { DetailSkeleton, ErrorState } from '@/src/components/ContentState';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { useSavedPlaces } from '@/src/providers/SavedPlacesProvider';
import { openInAppleMaps, openInNaverMap } from '@/src/services/naver-map';
import { layout, pretendard } from '@/src/theme/tokens';

export function PlaceDetailScreen({ id }: { id: string }) {
  const { colors } = useAppTheme();
  const { isSaved, toggleSaved } = useSavedPlaces();
  const { error, findPlace, loading, refresh } = usePlaceData();
  const place = findPlace(id);
  if (!place) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader back title="장소 정보" />
        {loading ? <DetailSkeleton /> : error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
          <View style={styles.notFound}>
            <Text selectable style={[styles.title, { color: colors.text }]}>장소를 찾을 수 없어요</Text>
            <HapticPressable onPress={() => router.back()}><Text style={{ color: colors.primaryStrong }}>돌아가기</Text></HapticPressable>
          </View>
        )}
      </View>
    );
  }
  const saved = isSaved(place.id);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="장소 정보" right={<HapticPressable accessibilityLabel={saved ? '저장 취소' : '장소 저장'} feedback="success" onPress={() => toggleSaved(place.id)} style={styles.headerAction}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={23} color={colors.primaryStrong} /></HapticPressable>} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HapticPressable
          accessibilityLabel={place.heroImageUrl ? `${place.name} 대표 사진 크게 보기` : undefined}
          disabled={!place.heroImageUrl}
          feedback={place.heroImageUrl ? 'light' : 'none'}
          onPress={() => router.push({ pathname: '/media/[placeId]', params: { placeId: place.id, index: '0' } })}
          style={styles.hero}
        >
          <LinearGradient colors={place.accent} style={StyleSheet.absoluteFill} />
          {place.heroImageUrl ? <Image source={{ uri: place.heroImageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={200} style={StyleSheet.absoluteFill} /> : null}
          {place.heroImageUrl ? <LinearGradient colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.62)']} style={StyleSheet.absoluteFill} /> : null}
          <Text selectable style={styles.heroRegion}>{place.region} · {place.area}</Text>
        </HapticPressable>
        {place.images && place.images.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>{place.images.slice(1, 8).map((image, index) => <HapticPressable accessibilityLabel={image.description || `${place.name} 사진 ${index + 2} 크게 보기`} feedback="light" key={`${image.url}-${index}`} onPress={() => router.push({ pathname: '/media/[placeId]', params: { placeId: place.id, index: String(index + 1) } })}><Image source={{ uri: image.thumbnailUrl || image.url }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={styles.galleryImage} /></HapticPressable>)}</ScrollView> : null}
        <View style={styles.heading}>
          <Text selectable style={[styles.category, { color: colors.primaryStrong }]}>{place.categoryLabel}</Text>
          <Text selectable style={[styles.title, { color: colors.text }]}>{place.name}</Text>
          {place.tags.length ? <Text selectable numberOfLines={2} style={[styles.tagLine, { color: colors.muted }]}>{place.tags.slice(0, 5).join(' · ')}</Text> : null}
        </View>
        <Text selectable style={[styles.lead, { color: colors.text }]}>{place.highlight || place.summary}</Text>
        {place.summary && place.summary !== place.highlight ? (
          <View style={[styles.story, { borderColor: colors.border }]}>
            <Text selectable style={[styles.storyTitle, { color: colors.text }]}>장소 이야기</Text>
            <Text selectable style={[styles.summary, { color: colors.muted }]}>{place.summary}</Text>
          </View>
        ) : null}
        {place.address || place.phone || place.openingHours || place.restDate || place.parking ? <View style={[styles.details, { borderColor: colors.border }]}>
          <Text selectable style={[styles.detailsTitle, { color: colors.text }]}>이용 정보</Text>
          {place.address ? <DetailRow icon="location-outline" label="주소" value={place.address} /> : null}
          {place.phone ? <DetailRow icon="call-outline" label="전화" value={place.phone} /> : null}
          {place.openingHours ? <DetailRow icon="time-outline" label="이용시간" value={place.openingHours} /> : null}
          {place.restDate ? <DetailRow icon="calendar-outline" label="쉬는 날" value={place.restDate} /> : null}
          {place.parking ? <DetailRow icon="car-outline" label="주차" value={place.parking} /> : null}
        </View> : null}
        <View style={styles.actions}>
          <HapticPressable accessibilityLabel="네이버 지도에서 보기" feedback="medium" onPress={() => void openInNaverMap(place)} style={[styles.mapButton, { backgroundColor: colors.primary }]}><Ionicons name="navigate-outline" size={19} color={colors.onPrimary} /><Text style={[styles.primaryText, { color: colors.onPrimary }]}>네이버 지도</Text></HapticPressable>
          <HapticPressable accessibilityLabel="Apple 지도에서 보기" feedback="medium" onPress={() => void openInAppleMaps(place)} style={[styles.mapButton, { borderColor: colors.border, backgroundColor: colors.surface }]}><Ionicons name="map-outline" size={19} color={colors.text} /><Text style={[styles.primaryText, { color: colors.text }]}>Apple 지도</Text></HapticPressable>
          <HapticPressable accessibilityLabel="장소 공유" feedback="light" onPress={() => void Share.share({ message: `${place.name}\nhttps://uulab.co.kr/places/${place.id}` })} style={[styles.secondaryButton, { borderColor: colors.border }]}><Ionicons name="share-outline" size={20} color={colors.text} /></HapticPressable>
        </View>
        <View style={[styles.source, { borderColor: colors.border }]}><View style={styles.sourceCopy}><Text selectable style={[styles.sourceLabel, { color: colors.muted }]}>관광정보·이미지 출처</Text><Text selectable style={[styles.sourceName, { color: colors.text }]}>{place.sourceName}</Text>{place.sourceLicense ? <Text selectable style={[styles.sourceLicense, { color: colors.muted }]}>{place.sourceLicense}</Text> : null}</View><HapticPressable onPress={() => void Linking.openURL(place.sourceUrl)}><Text style={[styles.sourceLink, { color: colors.primaryStrong }]}>공식 정보 열기</Text></HapticPressable></View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.detailRow}><Ionicons name={icon as never} size={18} color={colors.primaryStrong} /><Text selectable style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text><Text selectable style={[styles.detailValue, { color: colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerAction: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 38, gap: 20 },
  hero: { height: 212, borderRadius: 14, padding: 16, justifyContent: 'flex-end', overflow: 'hidden', borderCurve: 'continuous' },
  heroRegion: { ...pretendard(800), color: '#FFFFFF', fontSize: 13 },
  gallery: { gap: 8, paddingRight: 10 },
  galleryImage: { width: 126, height: 84, borderRadius: 10 },
  heading: { gap: 6 },
  title: { ...pretendard(900), fontSize: 28, lineHeight: 36 },
  category: { ...pretendard(900), fontSize: 12 },
  tagLine: { ...pretendard(400), fontSize: 12, lineHeight: 18 },
  lead: { ...pretendard(600), fontSize: 17, lineHeight: 27 },
  story: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 18, gap: 9 },
  storyTitle: { ...pretendard(900), fontSize: 17 },
  summary: { ...pretendard(400), fontSize: 15, lineHeight: 25 },
  details: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 17, gap: 13 },
  detailsTitle: { ...pretendard(900), fontSize: 16, paddingBottom: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailLabel: { ...pretendard(400), width: 56, fontSize: 12, lineHeight: 19 },
  detailValue: { ...pretendard(400), flex: 1, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8 },
  mapButton: { flex: 1, minHeight: 52, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  primaryText: { ...pretendard(900), fontSize: 13 },
  secondaryButton: { width: 52, height: 52, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  source: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sourceCopy: { flex: 1, gap: 3 },
  sourceLabel: { ...pretendard(400), fontSize: 11 },
  sourceName: { ...pretendard(800), fontSize: 14 },
  sourceLicense: { ...pretendard(400), fontSize: 10, lineHeight: 15 },
  sourceLink: { ...pretendard(900), fontSize: 12 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
