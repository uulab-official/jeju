import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { getTravelGuide, resolveGuidePlaces } from '@/src/data/travel-guides';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';

export function TravelGuideScreen({ id }: { id: string }) {
  const { colors } = useAppTheme();
  const { places } = usePlaceData();
  const guide = getTravelGuide(id);

  if (!guide) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader back title="여행 가이드" />
        <View style={styles.notFound}>
          <Ionicons name="compass-outline" size={36} color={colors.muted} />
          <Text style={[styles.notFoundTitle, { color: colors.text }]}>가이드를 찾을 수 없어요</Text>
          <HapticPressable onPress={() => router.back()}><Text style={{ color: colors.primaryStrong }}>돌아가기</Text></HapticPressable>
        </View>
      </View>
    );
  }

  const guidePlaces = resolveGuidePlaces(guide, places);
  const coverPlace = guidePlaces.find((place) => place.heroImageUrl) ?? guidePlaces[0];
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="여행 가이드" right={<HapticPressable accessibilityLabel="여행 가이드 공유" feedback="light" onPress={() => void Share.share({ title: guide.title, message: `${guide.title}\n\n${guide.summary}\n\n소랑제주` })} style={styles.shareButton}><Ionicons name="share-outline" size={21} color={colors.text} /></HapticPressable>} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={guide.accent} style={StyleSheet.absoluteFill} />
          {coverPlace?.heroImageUrl ? <Image source={{ uri: coverPlace.heroImageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={180} style={StyleSheet.absoluteFill} /> : null}
          <LinearGradient colors={['rgba(20,16,13,0.05)', 'rgba(20,16,13,0.8)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{guide.eyebrow}</Text>
            <Text selectable style={styles.title}>{guide.title}</Text>
            <Text selectable numberOfLines={1} style={styles.coverCredit}>{coverPlace ? `${coverPlace.region} · ${coverPlace.area}` : '소랑제주 여행 가이드'}</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text selectable style={[styles.summary, { color: colors.text }]}>{guide.summary}</Text>
          <View style={[styles.metaRow, { borderColor: colors.border }]}>
            <View style={styles.meta}><Ionicons name="time-outline" size={17} color={colors.primaryStrong} /><Text style={[styles.metaText, { color: colors.text }]}>{guide.duration}</Text></View>
            <View style={styles.meta}><Ionicons name="footsteps-outline" size={17} color={colors.primaryStrong} /><Text style={[styles.metaText, { color: colors.text }]}>{guide.pace}</Text></View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>코스 순서</Text>
          <Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>공식 관광정보에서 고른 {guidePlaces.length}곳</Text>
        </View>
        <View style={[styles.steps, { borderColor: colors.border }]}>
          {guidePlaces.map((place, index) => (
            <HapticPressable
              key={place.id}
              onPress={() => router.push({ pathname: '/places/[id]', params: { id: place.id } })}
              style={[styles.step, index < guidePlaces.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <Text style={[styles.stepNumberText, { color: colors.primaryStrong }]}>{String(index + 1).padStart(2, '0')}</Text>
              {place.heroImageUrl ? <Image source={{ uri: place.heroImageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={styles.stepImage} /> : <View style={[styles.stepImage, { backgroundColor: colors.surfaceAlt }]} />}
              <View style={styles.stepCopy}>
                <Text selectable style={[styles.stepName, { color: colors.text }]}>{place.name}</Text>
                <Text selectable numberOfLines={1} style={[styles.stepArea, { color: colors.muted }]}>{place.region} · {place.area}</Text>
                <Text selectable numberOfLines={2} style={[styles.stepSummary, { color: colors.muted }]}>{place.summary}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </HapticPressable>
          ))}
        </View>

        <HapticPressable
          feedback="medium"
          onPress={() => router.push('/map')}
          style={[styles.mapButton, { borderColor: colors.border }]}
        >
          <Ionicons name="map-outline" size={20} color={colors.primaryStrong} />
          <View style={styles.mapButtonCopy}>
            <Text selectable style={[styles.mapButtonTitle, { color: colors.text }]}>이 코스를 지도에서 보기</Text>
            <Text selectable style={[styles.mapButtonText, { color: colors.muted }]}>주변 장소와 위치를 함께 확인</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </HapticPressable>

        <View style={[styles.tipCard, { backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.tipCopy}>
            <Text selectable style={[styles.tipTitle, { color: colors.text }]}>출발 전 확인</Text>
            {guide.tips.map((tip) => <Text selectable key={tip} style={[styles.tipText, { color: colors.muted }]}>• {tip}</Text>)}
          </View>
        </View>
        <View style={[styles.sourceCard, { borderColor: colors.border }]}>
          <Text selectable style={[styles.sourceText, { color: colors.muted }]}>자료 출처: 한국관광공사 TourAPI와 출처가 표시된 공식 관광정보. 운영시간·예약·기상 정보는 방문 직전 다시 확인해 주세요.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 40, gap: 22 },
  hero: { height: 230, borderRadius: 14, justifyContent: 'flex-end', overflow: 'hidden', borderCurve: 'continuous' },
  heroCopy: { padding: 18, gap: 6 },
  eyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '800' },
  title: { color: '#FFFFFF', fontFamily: 'NanumOld', fontSize: 28, lineHeight: 36 },
  coverCredit: { color: 'rgba(255,255,255,0.82)', fontSize: 12 },
  intro: { gap: 14 },
  summary: { fontSize: 16, lineHeight: 25 },
  metaRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 22, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { fontSize: 13, fontWeight: '700' },
  sectionHeading: { gap: 4 },
  sectionTitle: { fontSize: 21, fontWeight: '900' },
  sectionCaption: { fontSize: 12 },
  steps: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  step: { minHeight: 108, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNumberText: { width: 22, fontSize: 12, fontWeight: '900' },
  stepImage: { width: 72, height: 78, borderRadius: 10 },
  stepCopy: { flex: 1, gap: 3 },
  stepName: { fontSize: 16, fontWeight: '900' },
  stepSummary: { fontSize: 12, lineHeight: 17 },
  stepArea: { fontSize: 11 },
  mapButton: { minHeight: 66, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  mapButtonCopy: { flex: 1, gap: 3 },
  mapButtonTitle: { fontSize: 14, fontWeight: '900' },
  mapButtonText: { fontSize: 11, lineHeight: 17 },
  tipCard: { borderRadius: 12, padding: 16 },
  tipCopy: { flex: 1, gap: 7 },
  tipTitle: { fontSize: 15, fontWeight: '900' },
  tipText: { fontSize: 12, lineHeight: 19 },
  sourceCard: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 15 },
  sourceText: { fontSize: 11, lineHeight: 17 },
  shareButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: '900' },
});
