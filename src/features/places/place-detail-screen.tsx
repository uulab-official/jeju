import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { ErrorState, ListSkeleton } from '@/src/components/ContentState';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { useSavedPlaces } from '@/src/providers/SavedPlacesProvider';
import { openInAppleMaps, openInNaverMap } from '@/src/services/naver-map';

export function PlaceDetailScreen({ id }: { id: string }) {
  const { colors } = useAppTheme();
  const { isSaved, toggleSaved } = useSavedPlaces();
  const { error, findPlace, loading, refresh } = usePlaceData();
  const place = findPlace(id);
  if (!place) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader back title="장소 정보" />
        {loading ? <ListSkeleton rows={5} /> : error ? (
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
      <AppHeader back title={place.name} right={<HapticPressable accessibilityLabel={saved ? '저장 취소' : '장소 저장'} feedback="success" onPress={() => toggleSaved(place.id)} style={styles.headerAction}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={23} color={colors.primaryStrong} /></HapticPressable>} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={place.accent} style={styles.hero}>
          {place.heroImageUrl ? <Image source={{ uri: place.heroImageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={200} style={StyleSheet.absoluteFill} /> : null}
          {place.heroImageUrl ? <LinearGradient colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.62)']} style={StyleSheet.absoluteFill} /> : null}
          <Ionicons name="location" size={38} color="rgba(255,255,255,0.92)" />
          <Text selectable style={styles.heroRegion}>{place.region} · {place.area}</Text>
        </LinearGradient>
        {place.images && place.images.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>{place.images.slice(1, 8).map((image, index) => <Image key={`${image.url}-${index}`} source={{ uri: image.thumbnailUrl || image.url }} contentFit="cover" cachePolicy="memory-disk" transition={150} accessibilityLabel={image.description || `${place.name} 사진 ${index + 2}`} style={styles.galleryImage} />)}</ScrollView> : null}
        <View style={styles.heading}><Text selectable style={[styles.title, { color: colors.text }]}>{place.name}</Text><Text selectable style={[styles.category, { color: colors.primaryStrong }]}>{place.categoryLabel}</Text></View>
        <Text selectable style={[styles.summary, { color: colors.text }]}>{place.summary}</Text>
        <View style={styles.tags}>{place.tags.map((tag) => <Text key={tag} style={[styles.tag, { backgroundColor: colors.surfaceAlt, color: colors.muted }]}>#{tag}</Text>)}</View>
        <View style={[styles.infoCard, { backgroundColor: colors.surfaceAlt }]}><Ionicons name="sparkles-outline" size={22} color={colors.primaryStrong} /><View style={styles.infoCopy}><Text selectable style={[styles.infoTitle, { color: colors.text }]}>알아두면 좋아요</Text><Text selectable style={[styles.infoText, { color: colors.muted }]}>{place.highlight}</Text></View></View>
        {place.address || place.phone || place.openingHours || place.restDate || place.parking ? <View style={[styles.details, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
        <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.reviewIcon}><Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primaryStrong} /></View><View style={styles.reviewCopy}><Text selectable style={[styles.reviewTitle, { color: colors.text }]}>제주를 다녀온 사람들의 이야기</Text><Text selectable style={[styles.reviewText, { color: colors.muted }]}>후기는 네이버에서 가져오지 않고, 이 앱 사용자가 직접 남기는 공간으로 준비하고 있어요.</Text></View></View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.detailRow}><Ionicons name={icon as never} size={18} color={colors.primaryStrong} /><Text selectable style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text><Text selectable style={[styles.detailValue, { color: colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, headerAction: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 18, paddingBottom: 38, gap: 17 }, hero: { height: 220, borderRadius: 26, padding: 20, justifyContent: 'space-between', overflow: 'hidden', borderCurve: 'continuous' }, heroRegion: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' }, gallery: { gap: 10, paddingRight: 10 }, galleryImage: { width: 138, height: 92, borderRadius: 16 }, heading: { gap: 5 }, title: { fontSize: 27, fontWeight: '900' }, category: { fontSize: 12, fontWeight: '900' }, summary: { fontSize: 16, lineHeight: 25 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11 }, infoCard: { borderRadius: 19, padding: 17, flexDirection: 'row', gap: 12 }, infoCopy: { flex: 1, gap: 5 }, infoTitle: { fontSize: 14, fontWeight: '900' }, infoText: { fontSize: 13, lineHeight: 20 }, details: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 13 }, detailsTitle: { fontSize: 16, fontWeight: '900', paddingBottom: 2 }, detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, detailLabel: { width: 56, fontSize: 12, lineHeight: 19 }, detailValue: { flex: 1, fontSize: 13, lineHeight: 19 }, actions: { flexDirection: 'row', gap: 8 }, mapButton: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 }, primaryText: { fontSize: 13, fontWeight: '900' }, secondaryButton: { width: 52, height: 52, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, source: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sourceCopy: { flex: 1, gap: 3 }, sourceLabel: { fontSize: 11 }, sourceName: { fontSize: 14, fontWeight: '800' }, sourceLicense: { fontSize: 10, lineHeight: 15 }, sourceLink: { fontSize: 12, fontWeight: '900' }, reviewCard: { borderWidth: 1, borderRadius: 20, padding: 17, flexDirection: 'row', gap: 12 }, reviewIcon: { paddingTop: 2 }, reviewCopy: { flex: 1, gap: 5 }, reviewTitle: { fontSize: 14, fontWeight: '900' }, reviewText: { fontSize: 13, lineHeight: 20 }, notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 } });
