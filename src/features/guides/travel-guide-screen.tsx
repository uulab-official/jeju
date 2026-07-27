import Ionicons from '@expo/vector-icons/Ionicons';
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
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="여행 가이드" right={<HapticPressable accessibilityLabel="여행 가이드 공유" feedback="light" onPress={() => void Share.share({ title: guide.title, message: `${guide.title}\n\n${guide.summary}\n\n소랑제주` })} style={styles.shareButton}><Ionicons name="share-outline" size={21} color={colors.text} /></HapticPressable>} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={guide.accent} style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name={guide.icon as never} size={28} color="#FFFFFF" /></View>
          <Text style={styles.eyebrow}>{guide.eyebrow}</Text>
          <Text selectable style={styles.title}>{guide.title}</Text>
          <Text selectable style={styles.summary}>{guide.summary}</Text>
          <View style={styles.metaRow}>
            <View style={styles.meta}><Ionicons name="time-outline" size={15} color="#FFFFFF" /><Text style={styles.metaText}>{guide.duration}</Text></View>
            <View style={styles.meta}><Ionicons name="footsteps-outline" size={15} color="#FFFFFF" /><Text style={styles.metaText}>{guide.pace}</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeading}>
          <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>이 순서로 만나보세요</Text>
          <Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>현재 공식 관광정보에서 {guidePlaces.length}곳을 골랐어요</Text>
        </View>
        <View style={styles.steps}>
          {guidePlaces.map((place, index) => (
            <HapticPressable
              key={place.id}
              onPress={() => router.push({ pathname: '/places/[id]', params: { id: place.id } })}
              style={[styles.step, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={[styles.stepNumberText, { color: colors.onPrimary }]}>{index + 1}</Text></View>
              <View style={styles.stepCopy}>
                <Text selectable style={[styles.stepName, { color: colors.text }]}>{place.name}</Text>
                <Text selectable numberOfLines={2} style={[styles.stepSummary, { color: colors.muted }]}>{place.summary}</Text>
                <Text selectable style={[styles.stepArea, { color: colors.primaryStrong }]}>{place.region} · {place.area}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </HapticPressable>
          ))}
        </View>

        <HapticPressable
          feedback="medium"
          onPress={() => router.push('/map')}
          style={[styles.mapButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="map-outline" size={20} color={colors.primaryStrong} />
          <View style={styles.mapButtonCopy}>
            <Text selectable style={[styles.mapButtonTitle, { color: colors.text }]}>이 코스를 지도에서 보기</Text>
            <Text selectable style={[styles.mapButtonText, { color: colors.muted }]}>주변 장소와 이동 위치를 한눈에 확인해요</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </HapticPressable>

        <View style={[styles.tipCard, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="sparkles-outline" size={23} color={colors.primaryStrong} />
          <View style={styles.tipCopy}>
            <Text selectable style={[styles.tipTitle, { color: colors.text }]}>출발 전 확인해요</Text>
            {guide.tips.map((tip) => <Text selectable key={tip} style={[styles.tipText, { color: colors.muted }]}>• {tip}</Text>)}
          </View>
        </View>
        <View style={[styles.sourceCard, { borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text selectable style={[styles.sourceText, { color: colors.muted }]}>한국관광공사 TourAPI와 비짓제주 등 출처가 표시된 관광정보를 가이드로 묶어요. 운영시간·예약·기상 정보는 방문 직전 공식 안내를 다시 확인해 주세요.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 40, gap: 18 },
  hero: { borderRadius: 28, minHeight: 280, padding: 23, justifyContent: 'flex-end', overflow: 'hidden', borderCurve: 'continuous' },
  heroIcon: { position: 'absolute', top: 22, right: 22, width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  title: { color: '#FFFFFF', fontFamily: 'NanumOld', fontSize: 29, lineHeight: 39, paddingTop: 7 },
  summary: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 21, paddingTop: 8, maxWidth: 300 },
  metaRow: { flexDirection: 'row', gap: 8, paddingTop: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.14)' },
  metaText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  sectionHeading: { gap: 4, paddingTop: 4 },
  sectionTitle: { fontSize: 21, fontWeight: '900' },
  sectionCaption: { fontSize: 12 },
  steps: { gap: 10 },
  step: { minHeight: 112, borderWidth: 1, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderCurve: 'continuous' },
  stepNumber: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 14, fontWeight: '900' },
  stepCopy: { flex: 1, gap: 4 },
  stepName: { fontSize: 16, fontWeight: '900' },
  stepSummary: { fontSize: 12, lineHeight: 18 },
  stepArea: { fontSize: 11, fontWeight: '800' },
  mapButton: { minHeight: 68, borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  mapButtonCopy: { flex: 1, gap: 3 },
  mapButtonTitle: { fontSize: 14, fontWeight: '900' },
  mapButtonText: { fontSize: 11, lineHeight: 17 },
  tipCard: { borderRadius: 20, padding: 17, flexDirection: 'row', gap: 12 },
  tipCopy: { flex: 1, gap: 7 },
  tipTitle: { fontSize: 15, fontWeight: '900' },
  tipText: { fontSize: 12, lineHeight: 19 },
  sourceCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sourceText: { flex: 1, fontSize: 11, lineHeight: 17 },
  shareButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: '900' },
});
